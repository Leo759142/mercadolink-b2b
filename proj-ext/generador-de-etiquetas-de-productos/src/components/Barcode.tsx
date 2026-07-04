import React from 'react';

// Code 39 character encoding (each character is mapped to an 11-bit binary pattern)
// 1 = black bar, 0 = white space
const CODE39_MAP: Record<string, string> = {
  '0': '101001101101',
  '1': '110100101011',
  '2': '101100101011',
  '3': '110110010101',
  '4': '101001101011',
  '5': '110100110101',
  '6': '101100110101',
  '7': '101001011011',
  '8': '110100101101',
  '9': '101100101101',
  'A': '110101001011',
  'B': '101101001011',
  'C': '110110100101',
  'D': '101011001011',
  'E': '110101100101',
  'F': '101101100101',
  'G': '101010011011',
  'H': '110101001101',
  'I': '101101001101',
  'J': '101011001101',
  'K': '110101010011',
  'L': '101101010011',
  'M': '110110101001',
  'N': '101011010011',
  'O': '110101101001',
  'P': '101101101001',
  'Q': '101010110011',
  'R': '110101011001',
  'S': '101101011001',
  'T': '101011011001',
  'U': '110010101011',
  'V': '100110101011',
  'W': '110011010101',
  'X': '100101101011',
  'Y': '110010110101',
  'Z': '100110110101',
  '-': '100101011011',
  '.': '110010101101',
  ' ': '100110101101',
  '*': '100101101101', // Start/Stop
  '$': '100100100101',
  '/': '100100101001',
  '+': '100101001001',
  '%': '101001001001'
};

interface BarcodeProps {
  value: string;
  height?: number;
  barWidth?: number;
  displayValue?: boolean;
  color?: string;
}

export const Barcode: React.FC<BarcodeProps> = ({
  value,
  height = 50,
  barWidth = 1.8,
  displayValue = true,
  color = '#000000'
}) => {
  // Clean and sanitize string for Code 39
  const sanitizeValue = (val: string): string => {
    const uppercase = val.toUpperCase();
    let sanitized = '';
    for (let i = 0; i < uppercase.length; i++) {
      const char = uppercase[i];
      if (CODE39_MAP[char]) {
        sanitized += char;
      } else if (char === ' ') {
        sanitized += ' ';
      } else {
        // Fallback or ignore invalid characters
        sanitized += '-';
      }
    }
    return sanitized || 'PRD';
  };

  const sanitized = sanitizeValue(value);
  // Code 39 requires start/stop character '*' at beginning and end
  const fullCode = `*${sanitized}*`;

  // Build the complete binary string of bars (1) and spaces (0)
  let binaryString = '';
  for (let i = 0; i < fullCode.length; i++) {
    const char = fullCode[i];
    binaryString += CODE39_MAP[char] || '';
    // Add a narrow space (0) between characters
    if (i < fullCode.length - 1) {
      binaryString += '0';
    }
  }

  const totalBars = binaryString.length;
  const svgWidth = totalBars * barWidth;

  return (
    <div className="flex flex-col items-center justify-center select-none" id="barcode-container">
      <svg
        width="100%"
        height={height}
        viewBox={`0 0 ${svgWidth} ${height}`}
        preserveAspectRatio="none"
        className="block"
        id="barcode-svg"
      >
        <g fill={color}>
          {binaryString.split('').map((bit, idx) => {
            if (bit === '1') {
              return (
                <rect
                  key={idx}
                  x={idx * barWidth}
                  y={0}
                  width={barWidth}
                  height={height}
                />
              );
            }
            return null;
          })}
        </g>
      </svg>
      {displayValue && (
        <span className="mt-1 font-mono text-[10px] tracking-[0.25em] text-center font-bold" id="barcode-text">
          {sanitized}
        </span>
      )}
    </div>
  );
};
