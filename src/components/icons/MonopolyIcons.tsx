import React from "react";
import { LucideProps } from "lucide-react";

export const BootIcon: React.FC<LucideProps> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M3 14c0-2 1-3.5 3.5-3.5S10 12 10 14" />
    <path d="M10 14c0-2 1-3.5 3.5-3.5S17 12 17 14" />
    <path d="M17 14h4v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4h14Z" />
  </svg>
);

export const TopHatIcon: React.FC<LucideProps> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect x="8" y="12" width="8" height="8" />
    <path d="M6 12h12" />
    <path d="M10 4h4v8h-4z" />
  </svg>
);

export const ThimbleIcon: React.FC<LucideProps> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M12 3a9 9 0 0 1 9 9v5a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3v-5a9 9 0 0 1 9-9z" />
    <path d="M8 12h8" />
    <path d="M8 8h8" />
  </svg>
);

export const WheelbarrowIcon: React.FC<LucideProps> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <circle cx="7" cy="17" r="2" />
    <path d="M16 17H4" />
    <path d="M4 17L9 7h10l-3 10" />
  </svg>
);
