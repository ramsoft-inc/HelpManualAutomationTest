class SelfSchedulingSettings {
    constructor(page) {
        this.page = page;
    }

    risMenuButton() {
        return this.page.getByRole('link', { name: 'RIS' });
    }

     selfSchedulingButton() {
        return this.page.getByRole('link', { name: 'Self Scheduling' });
    }

    editButton() {
        return this.page.getByRole('Button', { name: 'Edit' });
    }

    logoFileInputBox() {
        return this.page.getByTestId('file-input');
    }

    websiteUrlInput() {
        return this.page.getByPlaceholder('Website URL');
    }

    phoneNumberInput() {
        return this.page.getByPlaceholder('Phone number');
    }

    saveSelfSchedulingSettingsButton() {
        return this.page.getByRole('button', { name: 'Save' });
    }

    copyLinkButton() {
        return this.page.getByText('Copy Link');
    }

    removeOrgLogoButton() {
        return this.page.getByTestId('DeleteOutlinedIcon')
    }
}

module.exports = { SelfSchedulingSettings };