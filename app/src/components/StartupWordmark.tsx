import { useEffect, useState } from 'react';
import { View } from 'react-native';
import Svg, { ClipPath, Defs, G, Image, LinearGradient, Mask, Path, Rect, Stop } from 'react-native-svg';
import { Wordmark, wordmarkAspectRatio, wordmarkImage } from '@/components/Wordmark';
import { useReducedMotion } from '@/lib/useReducedMotion';

const logoWidth = 224;
const drawingTimeScale = 1.26;
const drawingDuration = 1240;
const wordSplit = 664;
const bridgeStart = 775;
const bridgeRelease = 970;
const bridgeEnd = 1080;
const bridgeCenterY = 148;

// Đường đi của bút theo tọa độ ảnh gốc 1024 × 207.
const letters = [
  { left: 0, right: 53, from: 0, to: 108, strokes: [
    { path: 'M26 36 V175', length: 139, width: 50 },
  ] },
  { left: 53, right: 193, from: 108, to: 240, strokes: [
    { path: 'M80 76 V125 C80 164 94 177 123 177 C152 177 167 162 167 125 V76', length: 250, width: 53 },
  ] },
  { left: 193, right: 402, from: 240, to: 404, strokes: [
    { path: 'M219 76 V179', length: 103, width: 53 },
    { path: 'M220 118 C223 61 299 59 299 118 V179', length: 182, width: 58 },
    { path: 'M300 118 C302 61 375 59 375 118 V179', length: 182, width: 58 },
  ] },
  { left: 402, right: 539, from: 404, to: 539, strokes: [
    { path: 'M471 77 C446 77 428 98 428 126 C428 154 446 177 471 177 C496 177 515 155 515 126 C515 98 496 77 471 77', length: 294, width: 55 },
  ] },
  { left: 539, right: 664, from: 539, to: 690, strokes: [
    { path: 'M631 83 C604 66 566 74 568 100 C570 129 629 118 635 147 C642 177 604 189 567 169', length: 211, width: 58 },
  ] },
  { left: 664, right: 714, from: 710, to: 810, strokes: [
    { path: 'M689 35 V176', length: 141, width: 49 },
  ] },
  { left: 714, right: 871, from: 810, to: 979, strokes: [
    { path: 'M786 77 C758 77 740 98 740 126 C740 155 758 177 786 177 C813 177 833 155 833 126 C833 98 813 77 786 77', length: 307, width: 56 },
    { path: 'M842 77 V176', length: 99, width: 55 },
  ] },
  { left: 871, right: 1024, from: 979, to: 1160, strokes: [
    { path: 'M898 27 V178', length: 151, width: 51 },
    { path: 'M947 76 C922 76 900 97 900 126 C900 155 921 177 947 177 C974 177 994 155 994 126 C994 97 974 76 947 76', length: 310, width: 56 },
  ] },
];

export function StartupWordmark({ onIntroEnd }: { onIntroEnd: () => void }) {
  const reduced = useReducedMotion(null);
  const [elapsed, setElapsed] = useState(0);
  const [motionUnavailable, setMotionUnavailable] = useState(false);
  const finished = elapsed >= drawingDuration || motionUnavailable;

  useEffect(() => {
    if (reduced === true || finished) onIntroEnd();
  }, [finished, onIntroEnd, reduced]);

  useEffect(() => {
    if (reduced !== false || finished) return;
    let start: number | undefined;
    let request: number;
    const draw = (now: number) => {
      start ??= now;
      const time = Math.min((now - start) / drawingTimeScale, drawingDuration);
      setElapsed(time);
      if (time < drawingDuration) request = requestAnimationFrame(draw);
    };
    request = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(request);
  }, [finished, reduced]);

  useEffect(() => {
    if (reduced !== null) return;
    const timeout = setTimeout(() => setMotionUnavailable(true), 300);
    return () => clearTimeout(timeout);
  }, [reduced]);

  if (reduced !== false || finished) return <Wordmark width={logoWidth} />;

  const currentLetter = letters.find(letter => elapsed < letter.to);
  const completedWidth = currentLetter?.left ?? 1024;
  const stretching = Math.max(0, Math.min(1, (elapsed - bridgeStart) / (bridgeRelease - bridgeStart)));
  const release = Math.max(0, Math.min(1, (elapsed - bridgeRelease) / (bridgeEnd - bridgeRelease)));
  const sticky = stretching > 0 && release < 1;
  const rightShift = 32 * stretching * (1 - release) ** 2;
  const leftEdge = 653;
  const rightEdge = 674 + rightShift;
  const center = (leftEdge + rightEdge) / 2;
  const edgeHeight = 22 * Math.min(stretching * 5, 1) * (1 - release);
  const neckHeight = 12 * (1 - stretching ** 3);
  const leftTip = leftEdge + (center - leftEdge) * (1 - release) ** 2;
  const rightTip = rightEdge - (rightEdge - center) * (1 - release) ** 2;

  return (
    <View accessible accessibilityRole="image" accessibilityLabel="lumoslens"
      style={{ width: '100%', maxWidth: logoWidth, aspectRatio: wordmarkAspectRatio }}>
      <Svg width="100%" height="100%" viewBox="0 0 1024 207" aria-hidden>
        <Defs>
          <ClipPath id="startupLumos">
            <Rect width={wordSplit} height={207} />
          </ClipPath>
          <ClipPath id="startupLab">
            <Rect x={wordSplit} width={1024 - wordSplit} height={207} />
          </ClipPath>
          {currentLetter && (
            <ClipPath id="startupLetter">
              <Rect x={currentLetter.left} width={currentLetter.right - currentLetter.left} height={207} />
            </ClipPath>
          )}
          <Mask id="startupInk" x={0} y={0} width={1024} height={207} maskUnits="userSpaceOnUse" maskContentUnits="userSpaceOnUse">
            <Rect x={0} y={0} width={completedWidth} height={207} fill="white" />
            {currentLetter && (
              <G clipPath="url(#startupLetter)">
                {currentLetter.strokes.map(({ path, length, width }, index, strokes) => {
                  const duration = (currentLetter.to - currentLetter.from) / strokes.length;
                  const progress = Math.max(0, Math.min(1, (elapsed - currentLetter.from) / duration - index));
                  return progress > 0 && <Path key={path} d={path}
                    stroke="white" strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" fill="none"
                    strokeDasharray={[length, length]} strokeDashoffset={length * (1 - progress)} />;
                })}
              </G>
            )}
          </Mask>
          <LinearGradient id="startupBridge" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#0F2452" />
            <Stop offset="100%" stopColor="#00A9DA" />
          </LinearGradient>
        </Defs>
        {sticky && (
          <G transform={`translate(0 ${bridgeCenterY})`}>
            {release === 0 ? (
              <Path
                d={`M${leftEdge} ${-edgeHeight} Q${leftEdge + 12} ${-neckHeight} ${center} ${-neckHeight}
                  Q${rightEdge - 12} ${-neckHeight} ${rightEdge} ${-edgeHeight} V${edgeHeight}
                  Q${rightEdge - 12} ${neckHeight} ${center} ${neckHeight}
                  Q${leftEdge + 12} ${neckHeight} ${leftEdge} ${edgeHeight} Z`}
                fill="url(#startupBridge)"
              />
            ) : (
              <G opacity={1 - release}>
                <Path d={`M${leftEdge} ${-edgeHeight} Q${leftEdge + 7} 0 ${leftTip} 0
                  Q${leftEdge + 7} 0 ${leftEdge} ${edgeHeight} Z`} fill="#0F2452" />
                <Path d={`M${rightEdge} ${-edgeHeight} Q${rightEdge - 7} 0 ${rightTip} 0
                  Q${rightEdge - 7} 0 ${rightEdge} ${edgeHeight} Z`} fill="#00A9DA" />
              </G>
            )}
          </G>
        )}
        <G clipPath="url(#startupLumos)">
          <Image href={wordmarkImage} width={1024} height={207} mask="url(#startupInk)" />
        </G>
        <G transform={`translate(${rightShift} 0)`}>
          <G clipPath="url(#startupLab)">
            <Image href={wordmarkImage} width={1024} height={207} mask="url(#startupInk)" />
          </G>
        </G>
      </Svg>
    </View>
  );
}
