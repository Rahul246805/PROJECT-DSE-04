import React from 'react';
import { motion } from 'framer-motion';

const MotionDiv = motion.div;

const AuthLoadingScreen = ({
  title = 'Authenticating Mate.AI...',
  description = 'Securing your session and preparing your AI workspace.',
}) => {
  return (
    <div className="auth-backdrop flex min-h-screen items-center justify-center px-4">
      <MotionDiv
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card w-full max-w-md rounded-[28px] p-8 text-center"
      >
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-cyan-400/30 bg-cyan-400/10">
          <span className="auth-orbit-loader" aria-hidden="true" />
        </div>
        <h2 className="font-display text-2xl font-semibold text-white">{title}</h2>
        <p className="mt-3 text-sm leading-7 text-slate-400">{description}</p>
      </MotionDiv>
    </div>
  );
};

export default AuthLoadingScreen;
