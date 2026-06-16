import React from 'react';

const ClerkAuthCard = ({ children, helperTitle = 'Secure access', helperText }) => {
  return (
    <div className="space-y-5">
      <div className="rounded-[26px] border border-white/10 bg-[linear-gradient(180deg,rgba(7,15,30,0.92),rgba(5,10,20,0.92))] p-5 shadow-[0_24px_70px_rgba(2,8,23,0.42)]">
        {children}
      </div>

      <div className="rounded-3xl border border-cyan-400/15 bg-cyan-400/8 px-4 py-3 text-sm text-slate-300">
        <p className="font-semibold text-cyan-200">{helperTitle}</p>
        <p className="mt-1 leading-6 text-slate-400">
          {helperText ||
            'Enable Google, GitHub, phone OTP, and email/password from your Clerk dashboard to surface them inside this prebuilt auth flow.'}
        </p>
      </div>
    </div>
  );
};

export default ClerkAuthCard;
