import React from 'react';
import Link from '@docusaurus/Link';
import Translate from '@docusaurus/Translate';
import styles from './TilesSection.module.css';

const tiles = [
//  { icon: '🚀', title: 'Getting Started', summary:'' link:'/docs/category/getting-started'},
  { 
    icon: '⚡', 
    title: <Translate id="tiles.documentViewer.title">Document Viewer</Translate>, 
    summary: <Translate id="tiles.documentViewer.summary">Document Management and Diagnostic Reporting</Translate>, 
    link: '/docs/category/document-viewer' 
  },
  { 
    icon: '🎉', 
    title: <Translate id="tiles.imageViewer.title">Image Viewer</Translate>, 
    summary: <Translate id="tiles.imageViewer.summary">Zero Footprint Diagnostic Image Viewer</Translate>, 
    link: '/docs/category/image-viewer' 
  },
  { 
    icon: '🔥', 
    title: <Translate id="tiles.globalSearch.title">Global Search</Translate>, 
    summary: <Translate id="tiles.globalSearch.summary">All in one search module, Remote DICOM Search</Translate>, 
    link: '/docs/category/global-search' 
  },
  { 
    icon: '💡', 
    title: <Translate id="tiles.communication.title">Communication and Organization Tools</Translate>, 
    summary: <Translate id="tiles.communication.summary">Logs, Organization Configurations</Translate>, 
    link: '/docs/category/communication-and-organization-tools' 
  },
  { 
    icon: '🌟', 
    title: <Translate id="tiles.root.title">Root</Translate>, 
    summary: <Translate id="tiles.root.summary">Business Analytics and Reporting</Translate>
  },
  { 
    icon: '💻', 
    title: <Translate id="tiles.omegaaiLink.title">OmegaAI Link</Translate>, 
    summary: <Translate id="tiles.omegaaiLink.summary">Connect TCP/IP DICOM capable PACS, Modalities to OmegaAI CLoud</Translate>, 
    link: '/docs/category/omegaai-link' 
  },
  { 
    icon: '📚', 
    title: <Translate id="tiles.advancedTopics.title">Advanced Topics</Translate>, 
    summary: <Translate id="tiles.advancedTopics.summary">Hanging Protocols, Image Pre-cache, Understanding Organizational Hierachies, and more</Translate>, 
    link: '/docs/category/advanced-topics' 
  },
  { 
    icon: '🔧', 
    title: <Translate id="tiles.workflowAutomation.title">Workflow Automation</Translate>, 
    summary: <Translate id="tiles.workflowAutomation.summary">Understanding OmegaAI\'s Visual Workflow Automation Designer</Translate>, 
    link: '/docs/category/workflow-automation' 
  },
];

function TilesSection() {
  return (
    <div className={styles.tilesContainer}>
      {tiles.map((tile, index) => (
        <Link key={index} to={tile.link} className={styles.tileLink}>
          <div className={styles.tile}>
            <div className={styles.icon}>{tile.icon}</div>
            <h3 className={styles.title}>{tile.title}</h3>
            <p className={styles.summary}>{tile.summary}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}

export default TilesSection;
