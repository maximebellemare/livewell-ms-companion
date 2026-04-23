import Foundation
import Capacitor
import AuthenticationServices
import CryptoKit

@objc(AppleNativeSignInPlugin)
public class AppleNativeSignInPlugin: CAPPlugin, CAPBridgedPlugin, ASAuthorizationControllerDelegate, ASAuthorizationControllerPresentationContextProviding {
    public let identifier = "AppleNativeSignInPlugin"
    public let jsName = "AppleNativeSignIn"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "authorize", returnType: CAPPluginReturnPromise)
    ]

    private var activeCall: CAPPluginCall?

    @objc func authorize(_ call: CAPPluginCall) {
        guard activeCall == nil else {
            call.reject("Another Apple sign in request is already in progress.", "IN_PROGRESS")
            return
        }

        guard let rawNonce = call.getString("nonce"), !rawNonce.isEmpty else {
            call.reject("A raw nonce is required for Sign in with Apple.", "MISSING_NONCE")
            return
        }

        let provider = ASAuthorizationAppleIDProvider()
        let request = provider.createRequest()
        let scopes = call.getArray("scopes", String.self) ?? ["email", "name"]

        request.requestedScopes = scopes.compactMap { scope in
            switch scope {
            case "email":
                return .email
            case "name":
                return .fullName
            default:
                return nil
            }
        }
        request.nonce = sha256(rawNonce)

        activeCall = call

        let controller = ASAuthorizationController(authorizationRequests: [request])
        controller.delegate = self
        controller.presentationContextProvider = self

        DispatchQueue.main.async {
            controller.performRequests()
        }
    }

    public func presentationAnchor(for controller: ASAuthorizationController) -> ASPresentationAnchor {
        return bridge?.viewController?.view.window ?? ASPresentationAnchor()
    }

    public func authorizationController(controller: ASAuthorizationController, didCompleteWithAuthorization authorization: ASAuthorization) {
        guard let call = activeCall else { return }
        activeCall = nil

        guard let credential = authorization.credential as? ASAuthorizationAppleIDCredential else {
            call.reject("Apple returned an unexpected credential type.", "INVALID_CREDENTIAL")
            return
        }

        var payload: [String: Any] = [
            "user": credential.user
        ]

        if let email = credential.email {
            payload["email"] = email
        }

        if let tokenData = credential.identityToken, let token = String(data: tokenData, encoding: .utf8) {
            payload["identityToken"] = token
        }

        if let codeData = credential.authorizationCode, let code = String(data: codeData, encoding: .utf8) {
            payload["authorizationCode"] = code
        }

        if credential.fullName?.givenName != nil || credential.fullName?.familyName != nil {
            payload["fullName"] = [
                "givenName": credential.fullName?.givenName as Any,
                "familyName": credential.fullName?.familyName as Any
            ]
        }

        call.resolve(payload)
    }

    public func authorizationController(controller: ASAuthorizationController, didCompleteWithError error: Error) {
        guard let call = activeCall else { return }
        activeCall = nil

        let nsError = error as NSError
        let code = ASAuthorizationError.Code(rawValue: nsError.code)

        switch code {
        case .canceled:
            call.reject("The user canceled Sign in with Apple.", "CANCELED", error)
        case .failed:
            call.reject("Sign in with Apple failed.", "FAILED", error)
        case .invalidResponse:
            call.reject("Apple returned an invalid response.", "INVALID_RESPONSE", error)
        case .notHandled:
            call.reject("Sign in with Apple could not be completed.", "NOT_HANDLED", error)
        case .unknown, .none:
            call.reject("An unknown Apple sign in error occurred.", "UNKNOWN", error)
        @unknown default:
            call.reject("An unsupported Apple sign in error occurred.", "UNKNOWN", error)
        }
    }

    private func sha256(_ input: String) -> String {
        let inputData = Data(input.utf8)
        let hashed = SHA256.hash(data: inputData)
        return hashed.compactMap { String(format: "%02x", $0) }.joined()
    }
}
