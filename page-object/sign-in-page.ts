import { BasePage } from "./base-page";
import { Element } from "../core/element/element";


export class SignInPage extends BasePage {

    emailAddressInput: Element;
    passwordInput: Element;
    signInButton: Element;

    constructor() {
        super();
        this.emailAddressInput = new Element("input#email");
        this.passwordInput = new Element("input#password");
        this.signInButton = new Element("//form[contains(@action, 'sign-in')]//button[@type='submit']");
    }


    async signIn(email: string, password: string): Promise<void> {
        await this.emailAddressInput.fillText(email);
        await this.passwordInput.fillText(password);
        await this.signInButton.click();
    }

    async signInAsAdmin(): Promise<void> {
        const adminEmail = process.env.USER_NAME || '';
        const adminPassword = process.env.PASSWORD || '';
        await this.signIn(adminEmail, adminPassword);
    }


}