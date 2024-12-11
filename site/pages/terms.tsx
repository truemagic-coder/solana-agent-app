import React from 'react';
import ReactMarkdown from 'react-markdown';
import terms from '../markdown/terms';

export default function Terms() {
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
            {terms}
          </ReactMarkdown>
        </div>
      </div>
    </>
  );
}
