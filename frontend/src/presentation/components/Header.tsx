import React from "react";

const Header: React.FC = () => {
  return (
    <header className="bg-indigo-600 shadow-md">
      <div className="container mx-auto px-4 py-4 flex items-center">
        <div className="flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-8 h-8"
          >
            <path d="M12 1.5a.75.75 0 0 1 .75.75V4.5a.75.75 0 0 1-1.5 0V2.25A.75.75 0 0 1 12 1.5ZM5.636 4.136a.75.75 0 0 1 1.06 0l1.592 1.591a.75.75 0 0 1-1.061 1.06L5.636 5.197a.75.75 0 0 1 0-1.06Zm12.728 0a.75.75 0 0 1 0 1.06l-1.591 1.592a.75.75 0 0 1-1.06-1.061l1.591-1.591a.75.75 0 0 1 1.06 0ZM12 18a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 12 18ZM18.364 19.864a.75.75 0 0 1-1.06 0l-1.591-1.591a.75.75 0 1 1 1.06-1.061l1.591 1.592a.75.75 0 0 1 0 1.06ZM5.636 19.864a.75.75 0 0 1 0-1.06l1.592-1.592a.75.75 0 1 1 1.06 1.06l-1.592 1.592a.75.75 0 0 1-1.06 0ZM2.25 12a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 0 1.5H3a.75.75 0 0 1-.75-.75ZM19.5 12a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 0 1.5h-1.5a.75.75 0 0 1-.75-.75ZM12 6.75a5.25 5.25 0 1 0 0 10.5 5.25 5.25 0 0 0 0-10.5Z" />
          </svg>
          <h1 className="text-xl font-bold text-white">Movies Explorer</h1>
        </div>
      </div>
    </header>
  );
};

export default Header;
