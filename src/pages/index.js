import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import Translate from '@docusaurus/Translate';
import styles from './index.module.css';

import TilesSection from '@site/src/components/TilesSection';
import ContactUsSection from '@site/src/components/ContactUsSection';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className="hero__title">
          <Translate id="homepage.title">{siteConfig.title}</Translate>
        </Heading>
        <p className="hero__subtitle">
          <Translate id="homepage.tagline">{siteConfig.tagline}</Translate>
        </p>
        <div className={styles.buttons}>
        <Link
            className="button button--secondary button--lg"
            to="/docs/Introduction/Intro">
            <Translate id="homepage.gettingStarted">
              Getting Started! ⏱️
            </Translate>
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function Home() {
  const {siteConfig} = useDocusaurusContext();
  
  return (
    <Layout
      title={`Hello from ${siteConfig.title}`}
      description={
        <Translate id="homepage.description">
          Description will go into a meta tag in head
        </Translate>
      }>
      <HomepageHeader />
      <main>
        <TilesSection />
        <ContactUsSection />
      </main>
    </Layout>
  );
}
