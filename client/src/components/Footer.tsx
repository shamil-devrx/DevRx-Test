import React from "react";
import { Link } from "wouter";

const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-neutral-200">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex justify-center md:justify-start space-x-6">
            <Link href="/about">
              <a className="text-neutral-600 hover:text-neutral-900">About</a>
            </Link>
            <Link href="/help">
              <a className="text-neutral-600 hover:text-neutral-900">Help</a>
            </Link>
            <Link href="/privacy">
              <a className="text-neutral-600 hover:text-neutral-900">Privacy</a>
            </Link>
            <Link href="/terms">
              <a className="text-neutral-600 hover:text-neutral-900">Terms</a>
            </Link>
          </div>
          <p className="mt-4 text-center md:mt-0 md:text-right text-sm text-neutral-500">&copy; {new Date().getFullYear()} DevRx. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
