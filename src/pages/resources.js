import React, { useState } from 'react';
import Layout from '@theme/Layout';
import Translate from '@docusaurus/Translate';

// Define the tab data for each PDF resource.
const tabsData = [
  {
    id: 'dicom',
    label: <Translate id="resources.dicom.label">OmegaAI DICOM Conformance Statement</Translate>,
    path: '/pdfs/OmegaAI-DICOM-Conformance.pdf',
  },
  {
    id: 'hl7',
    label: <Translate id="resources.hl7.label">OmegaAI HL7/FHIR Conformance Statement</Translate>,
    path: '/pdfs/FHIR-Statement.pdf',
  },
];

function Resources() {
  // activeTab is null when no tab is active.
  const [activeTab, setActiveTab] = useState(null);

  return (
    <Layout title="Resources" description="Download or view PDF resources">
      <div style={{ padding: '2rem' }}>
        <h1>
          <Translate id="resources.title">
            Resources
          </Translate>
        </h1>
        
        {/* Tab headers */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid #eaeaea',
            marginBottom: '1rem',
          }}
        >
          {tabsData.map((tab) => (
            <button
              key={tab.id}
              onClick={() =>
                setActiveTab((prev) => (prev === tab.id ? null : tab.id))
              }
              style={{
                background: 'none',
                border: 'none',
                padding: '0.5rem 1rem',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: activeTab === tab.id ? 'bold' : 'normal',
                borderBottom:
                  activeTab === tab.id ? '2px solid #1890ff' : '2px solid transparent',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content: render the PDF iframe if a tab is active */}
        {activeTab ? (
          (() => {
            const activeTabData = tabsData.find((tab) => tab.id === activeTab);
            return activeTabData ? (
              <iframe
                key={activeTabData.id}
                src={activeTabData.path}
                title={activeTabData.label}
                width="100%"
                height="600px"
                style={{ border: 'none' }}
              />
            ) : null;
          })()
        ) : (
          <p style={{ fontStyle: 'italic' }}>
            <Translate id="resources.noFileOpen">
              No file is open. Please select a tab above to view a PDF.
            </Translate>
          </p>
        )}
      </div>
    </Layout>
  );
}

export default Resources;
