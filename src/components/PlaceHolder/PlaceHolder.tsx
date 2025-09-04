import React from 'react';

export default function PlaceHolder({children}: {children: React.ReactNode}) {
  return (
      <span className="placeholder">
          {children}
      </span>
  );
}