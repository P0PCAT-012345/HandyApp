import React from 'react';
import { Link } from 'react-router-dom';
import './MenuButton2.css';

const MenuButton2: React.FC = () => {
  return (
    <div className="open">
      <span className="cls"></span>
      <span>
        <ul className="sub-menu">
          <li><Link to="/" title="translate">Translate</Link></li>
          <li><Link to="/record" title="record">Record new sign</Link></li>
          <li><Link to="/saved" title="view">View recordings</Link></li>
        </ul>
      </span>
      <span className="cls"></span>
    </div>
  );
};

export default MenuButton2;
