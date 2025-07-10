import React from 'react';
import Translate from '@docusaurus/Translate';
import styles from './ContactUsSection.module.css';

function ContactUsSection() {
  return (
    <div className={styles.contactUsContainer}>
      <h2>
        <Translate id="contactUs.title">
          Didn't find what you needed?
        </Translate>
      </h2>
      <div className={styles.contactUsContent}>
        <div>
          <h3>
            <Translate id="contactUs.heading">
              Contact us
            </Translate>
          </h3>
          <p>
            <Translate id="contactUs.support">
              We are available for support 24 hours a day 7 days a week.
            </Translate>
          </p>
        </div>
        <div className={styles.getInTouch}>
          <a target="_blank" href="https://www.ramsoft.com/company/support" className="button button--primary button--lg">
            <Translate id="contactUs.button">
              GET IN TOUCH
            </Translate>
          </a>
        </div>
      </div>
    </div>
  );
}

export default ContactUsSection;
