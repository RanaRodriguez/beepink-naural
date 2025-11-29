import { motion, MotionValue, useSpring, useTransform } from "motion/react";

interface BackgroundBlobProps {
  mouseX: MotionValue<number>;
  mouseY: MotionValue<number>;
}

export const BackgroundBlob = ({ mouseX, mouseY }: BackgroundBlobProps) => {
  // Center the blob on the mouse cursor
  // Assuming blob size is 800px, we offset by 400px
  const blobX = useTransform(mouseX, (x) => x - 400);
  const blobY = useTransform(mouseY, (y) => y - 400);

  // Very lazy spring physics for that heavy "blob" feel
  const springConfig = { damping: 50, stiffness: 20, mass: 2 };
  const x = useSpring(blobX, springConfig);
  const y = useSpring(blobY, springConfig);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.5 }}
      style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: -1 }}
    >
      <svg style={{ position: "absolute", width: 0, height: 0 }}>
        {/* 
            Expanded filter region to prevent edge clipping.
            x/y = -50% and width/height = 200% ensures the filter covers 
            the blur spread and shape changes well beyond the element bounds.
        */}
        <filter id="blob-noise" x="-50%" y="-50%" width="200%" height="200%">
          <motion.feTurbulence
            type="fractalNoise" 
            baseFrequency="0.4" // Coarser grain
            numOctaves="3" // Fewer octaves for rougher look
            stitchTiles="stitch"
            animate={{
                seed: [0, 15, 30, 45, 60] // Jump through seeds
            }}
            transition={{
                duration: 2, // Cycle through 50 seeds every 2 seconds
                repeat: Infinity,
                ease: "linear", // Steps didn't feel organic enough, linear with specific keyframes might be better or just rely on the rapid change
                times: [0, 0.2, 0.4, 0.6, 0.8, 1]
            }}
          />
          <feColorMatrix type="saturate" values="0" />
          <feComponentTransfer>
            {/* Increase contrast to make the static pop */}
            <feFuncA type="table" tableValues="0 0.8" /> 
            <feFuncR type="linear" slope="2" intercept="-0.5"/>
            <feFuncG type="linear" slope="2" intercept="-0.5"/>
            <feFuncB type="linear" slope="2" intercept="-0.5"/>
          </feComponentTransfer>
          <feComposite operator="in" in2="SourceGraphic" result="composite" />
          <feBlend mode="overlay" in="composite" in2="SourceGraphic" />
        </filter>
      </svg>
      
      <motion.div
        style={{
          x,
          y,
          position: "fixed",
          top: 0,
          left: 0,
          width: "800px",
          height: "800px",
          // Apply blur AND the noise filter
          filter: "blur(200px) url(#blob-noise)", // Reduced blur slightly to keep edges cleaner with the noise
          opacity: 0.2, // Increased visibility
          zIndex: -1,
          pointerEvents: "none",
          backgroundColor: "#ff00cc",
        }}
        animate={{
          backgroundColor: ["#ff00cc", "#aa00ff", "#cc00ff", "#ff00cc"],
          scale: [1, 1.1, 0.9, 1.05, 1],
          rotate: [0, 90, 180, 270, 360],
          borderRadius: [
            "60% 40% 30% 70% / 60% 30% 70% 40%",
            "30% 60% 70% 40% / 50% 60% 30% 60%",
            "60% 40% 30% 70% / 60% 30% 70% 40%",
            "40% 60% 60% 40% / 40% 30% 70% 60%",
            "60% 40% 30% 70% / 60% 30% 70% 40%",
          ],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut",
        }}
      />
    </motion.div>
  );
};
