import React from 'react';


/**
 * @example
 * <PlaceHolder>Default content or children</PlaceHolder>
 * @returns
 */
export default function PlaceHolder({children}: {children: React.ReactNode}) {
  return (
      <span className="placeholder">
          {children}
      </span>
  );
}