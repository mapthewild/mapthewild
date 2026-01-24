import React from 'react';
export function CoffeeCupsIllustration() {
  return (
    <svg viewBox="0 0 400 300" className="w-full max-w-md mx-auto">
      {/* Wooden table */}
      <rect
        x="0"
        y="220"
        width="400"
        height="80"
        fill="#D4A574"
        opacity="0.3" />


      {/* Coffee cup 1 */}
      <ellipse cx="120" cy="180" rx="35" ry="8" fill="#8BA888" opacity="0.2" />
      <rect x="85" y="140" width="70" height="40" rx="5" fill="#E8D5B7" />
      <rect x="90" y="145" width="60" height="30" fill="#8B6F47" />
      <path
        d="M 155 155 Q 175 155 175 165 Q 175 175 155 175"
        stroke="#E8D5B7"
        strokeWidth="3"
        fill="none" />


      {/* Steam 1 */}
      <path
        d="M 110 135 Q 105 120 110 105"
        stroke="#8BA888"
        strokeWidth="2"
        fill="none"
        opacity="0.4">

        <animate
          attributeName="d"
          values="M 110 135 Q 105 120 110 105; M 110 135 Q 115 120 110 105; M 110 135 Q 105 120 110 105"
          dur="3s"
          repeatCount="indefinite" />

      </path>
      <path
        d="M 130 135 Q 135 120 130 105"
        stroke="#8BA888"
        strokeWidth="2"
        fill="none"
        opacity="0.4">

        <animate
          attributeName="d"
          values="M 130 135 Q 135 120 130 105; M 130 135 Q 125 120 130 105; M 130 135 Q 135 120 130 105"
          dur="3s"
          repeatCount="indefinite"
          begin="0.5s" />

      </path>

      {/* Coffee cup 2 */}
      <ellipse cx="280" cy="180" rx="35" ry="8" fill="#E07856" opacity="0.2" />
      <rect x="245" y="140" width="70" height="40" rx="5" fill="#E8D5B7" />
      <rect x="250" y="145" width="60" height="30" fill="#8B6F47" />
      <path
        d="M 245 155 Q 225 155 225 165 Q 225 175 245 175"
        stroke="#E8D5B7"
        strokeWidth="3"
        fill="none" />


      {/* Steam 2 */}
      <path
        d="M 270 135 Q 265 120 270 105"
        stroke="#E07856"
        strokeWidth="2"
        fill="none"
        opacity="0.4">

        <animate
          attributeName="d"
          values="M 270 135 Q 265 120 270 105; M 270 135 Q 275 120 270 105; M 270 135 Q 265 120 270 105"
          dur="3s"
          repeatCount="indefinite"
          begin="1s" />

      </path>
      <path
        d="M 290 135 Q 295 120 290 105"
        stroke="#E07856"
        strokeWidth="2"
        fill="none"
        opacity="0.4">

        <animate
          attributeName="d"
          values="M 290 135 Q 295 120 290 105; M 290 135 Q 285 120 290 105; M 290 135 Q 295 120 290 105"
          dur="3s"
          repeatCount="indefinite"
          begin="1.5s" />

      </path>

      {/* Post-it notes scattered */}
      <rect
        x="170"
        y="190"
        width="60"
        height="60"
        rx="2"
        fill="#FFF4CC"
        opacity="0.8"
        transform="rotate(-5 200 220)" />

      <line
        x1="175"
        y1="205"
        x2="220"
        y2="205"
        stroke="#F4C430"
        strokeWidth="1"
        opacity="0.3" />

      <line
        x1="175"
        y1="215"
        x2="215"
        y2="215"
        stroke="#F4C430"
        strokeWidth="1"
        opacity="0.3" />


      {/* Plant in corner */}
      <ellipse cx="350" cy="200" rx="25" ry="10" fill="#8BA888" opacity="0.2" />
      <rect x="340" y="180" width="20" height="20" fill="#E8D5B7" />
      <path
        d="M 350 180 Q 340 160 345 145"
        stroke="#8BA888"
        strokeWidth="3"
        fill="none" />

      <path
        d="M 350 180 Q 360 165 355 150"
        stroke="#8BA888"
        strokeWidth="3"
        fill="none" />

      <ellipse cx="345" cy="145" rx="8" ry="12" fill="#8BA888" />
      <ellipse cx="355" cy="150" rx="8" ry="12" fill="#8BA888" />
    </svg>);

}
export function TwoChairsIllustration({
  filled = false


}: {filled?: boolean;}) {
  return (
    <svg viewBox="0 0 300 200" className="w-full max-w-sm mx-auto">
      {/* Coffee table */}
      <rect
        x="100"
        y="120"
        width="100"
        height="50"
        rx="5"
        fill="#D4A574"
        opacity="0.3" />


      {/* Chair 1 */}
      <rect
        x="30"
        y="80"
        width="60"
        height="10"
        rx="5"
        fill={filled ? '#8BA888' : '#E8D5B7'} />

      <rect
        x="35"
        y="90"
        width="50"
        height="60"
        rx="5"
        fill={filled ? '#8BA888' : '#E8D5B7'} />

      <rect
        x="40"
        y="40"
        width="40"
        height="45"
        rx="5"
        fill={filled ? '#8BA888' : '#E8D5B7'} />

      <rect
        x="35"
        y="150"
        width="10"
        height="30"
        fill={filled ? '#6B9668' : '#D4A574'} />

      <rect
        x="75"
        y="150"
        width="10"
        height="30"
        fill={filled ? '#6B9668' : '#D4A574'} />


      {/* Chair 2 */}
      <rect
        x="210"
        y="80"
        width="60"
        height="10"
        rx="5"
        fill={filled ? '#E07856' : '#E8D5B7'} />

      <rect
        x="215"
        y="90"
        width="50"
        height="60"
        rx="5"
        fill={filled ? '#E07856' : '#E8D5B7'} />

      <rect
        x="220"
        y="40"
        width="40"
        height="45"
        rx="5"
        fill={filled ? '#E07856' : '#E8D5B7'} />

      <rect
        x="215"
        y="150"
        width="10"
        height="30"
        fill={filled ? '#D66847' : '#D4A574'} />

      <rect
        x="255"
        y="150"
        width="10"
        height="30"
        fill={filled ? '#D66847' : '#D4A574'} />

    </svg>);

}
export function HandoffIllustration() {
  return (
    <svg viewBox="0 0 300 200" className="w-full max-w-sm mx-auto">
      {/* Person 1 (giving device) */}
      <circle cx="80" cy="80" r="25" fill="#8BA888" opacity="0.3" />
      <rect
        x="60"
        y="105"
        width="40"
        height="60"
        rx="20"
        fill="#8BA888"
        opacity="0.3" />


      {/* Device */}
      <rect x="120" y="90" width="60" height="40" rx="5" fill="#3A3A3A" />
      <rect x="125" y="95" width="50" height="30" fill="#FAF7F2" />

      {/* Arrow */}
      <path
        d="M 180 110 L 200 110"
        stroke="#E07856"
        strokeWidth="3"
        fill="none" />

      <path
        d="M 195 105 L 200 110 L 195 115"
        stroke="#E07856"
        strokeWidth="3"
        fill="none" />


      {/* Person 2 (receiving) */}
      <circle cx="220" cy="80" r="25" fill="#E07856" opacity="0.3" />
      <rect
        x="200"
        y="105"
        width="40"
        height="60"
        rx="20"
        fill="#E07856"
        opacity="0.3" />

    </svg>);

}
export function TogetherIllustration() {
  return (
    <svg viewBox="0 0 300 200" className="w-full max-w-sm mx-auto">
      {/* Couch */}
      <rect x="50" y="120" width="200" height="60" rx="10" fill="#E8D5B7" />
      <rect x="40" y="110" width="220" height="20" rx="10" fill="#D4A574" />

      {/* Person 1 */}
      <circle cx="110" cy="90" r="20" fill="#8BA888" opacity="0.5" />
      <rect
        x="95"
        y="110"
        width="30"
        height="40"
        rx="15"
        fill="#8BA888"
        opacity="0.5" />


      {/* Person 2 */}
      <circle cx="190" cy="90" r="20" fill="#E07856" opacity="0.5" />
      <rect
        x="175"
        y="110"
        width="30"
        height="40"
        rx="15"
        fill="#E07856"
        opacity="0.5" />


      {/* Device between them */}
      <rect x="135" y="125" width="30" height="20" rx="2" fill="#3A3A3A" />

      {/* Checkmarks above heads */}
      <path
        d="M 100 65 L 105 70 L 115 55"
        stroke="#8BA888"
        strokeWidth="3"
        fill="none" />

      <path
        d="M 180 65 L 185 70 L 195 55"
        stroke="#E07856"
        strokeWidth="3"
        fill="none" />


      {/* Coffee cups on table */}
      <ellipse cx="80" cy="155" rx="15" ry="5" fill="#8B6F47" />
      <ellipse cx="220" cy="155" rx="15" ry="5" fill="#8B6F47" />
    </svg>);

}