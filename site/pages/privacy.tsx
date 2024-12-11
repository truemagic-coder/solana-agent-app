import React from 'react';
import ReactMarkdown from 'react-markdown';
import privacy from '../markdown/privacy';

export default function Privacy() {
  return (
    <>
      <meta name="robots" content="noindex, follow" />
      <div
        className="mb-5"
        data-testid="external"
        style={{
          backgroundColor: 'black',
          color: 'white',
          padding: '20px',
          minHeight: '100vh', // This ensures the black background covers the full viewport height
        }}
      >
        <div data-testid="external-text">
          <ReactMarkdown>
            {privacy}
          </ReactMarkdown>
        </div>
      </div>
    </>
  );
}
