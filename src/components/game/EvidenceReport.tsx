import { FC } from 'react';
import '@/styles/evidence.css';

interface EvidenceReportProps {
  metadata: {
    caseNumber: string;
    date: string;
    location: string;
    type?: string;
  };
  description: string;
  content: string;
}

const EvidenceReport: FC<EvidenceReportProps> = ({ metadata, description, content }) => {
  return (
    <div className="evidence-sheet">
      <div className="evidence-stamp">CONFIDENTIAL</div>
      
      <div className="evidence-header">
        <div className="header-title">EVIDENCE REPORT</div>
        <div className="header-subtitle">Metropolitan Police Service</div>
        <div className="header-division">Criminal Investigation Department</div>
      </div>

      <div className="evidence-metadata">
        <span className="metadata-label">Case Number:</span>
        <span>{metadata.caseNumber}</span>
        
        <span className="metadata-label">Date:</span>
        <span>{metadata.date}</span>
        
        <span className="metadata-label">Location:</span>
        <span>{metadata.location}</span>
        
        {metadata.type && (
          <>
            <span className="metadata-label">Type:</span>
            <span>{metadata.type}</span>
          </>
        )}
      </div>

      {description && (
        <div className="content-section">
          <div className="content-heading">Description</div>
          <div className="evidence-content">
            {description}
          </div>
        </div>
      )}

      <div className="content-section">
        <div className="content-heading">Collected Evidence</div>
        <div className="evidence-content evidence-text">
          {content}
        </div>
      </div>
    </div>
  );
};

export default EvidenceReport;
