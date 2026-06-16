export const CLERK_PATHS = {
  signIn: '/login',
  signUp: '/register',
  afterSignIn: '/app',
  afterSignUp: '/app',
  home: '/',
};

export const clerkAppearance = {
  variables: {
    colorPrimary: '#22d3ee',
    colorText: '#ecfeff',
    colorTextSecondary: '#a5b4fc',
    colorBackground: 'rgba(5, 11, 23, 0.82)',
    colorInputBackground: 'rgba(13, 20, 38, 0.92)',
    colorInputText: '#f8fafc',
    colorDanger: '#fb7185',
    borderRadius: '22px',
    fontFamily: '"Manrope", sans-serif',
  },
  layout: {
    socialButtonsPlacement: 'top',
    socialButtonsVariant: 'blockButton',
    shimmer: true,
    showOptionalFields: false,
    helpPageUrl: CLERK_PATHS.signIn,
  },
  elements: {
    rootBox: 'w-full',
    cardBox: 'w-full shadow-none',
    card:
      'border border-white/10 bg-transparent shadow-none backdrop-blur-none p-0',
    headerTitle: 'hidden',
    headerSubtitle: 'hidden',
    socialButtonsBlockButton:
      'bg-white/5 border border-cyan-400/20 text-slate-100 hover:bg-cyan-400/10 transition-all duration-300 rounded-2xl',
    socialButtonsBlockButtonText: 'font-medium',
    socialButtonsProviderIcon: 'text-cyan-300',
    dividerLine: 'bg-white/10',
    dividerText: 'text-slate-400',
    formFieldLabel: 'text-slate-300 font-medium',
    formFieldInput:
      'rounded-2xl border border-white/10 bg-slate-950/70 text-slate-100 focus:border-cyan-300 focus:ring-4 focus:ring-cyan-400/10',
    formButtonPrimary:
      'rounded-2xl bg-[linear-gradient(135deg,#22d3ee_0%,#8b5cf6_100%)] text-slate-950 font-semibold shadow-[0_18px_60px_rgba(34,211,238,0.25)] hover:scale-[1.01] hover:shadow-[0_22px_70px_rgba(139,92,246,0.3)] transition-all duration-300',
    footerActionLink: 'text-cyan-300 hover:text-fuchsia-300 transition-colors duration-300',
    formFieldAction: 'text-cyan-300 hover:text-fuchsia-300 transition-colors duration-300',
    identityPreviewText: 'text-slate-300',
    identityPreviewEditButton: 'text-cyan-300 hover:text-fuchsia-300',
    alertText: 'text-rose-200',
    alert: 'border border-rose-400/20 bg-rose-400/10 rounded-2xl',
    otpCodeFieldInput:
      'rounded-2xl border border-white/10 bg-slate-950/70 text-slate-100 focus:border-cyan-300 focus:ring-4 focus:ring-cyan-400/10',
    formResendCodeLink: 'text-cyan-300 hover:text-fuchsia-300',
    navbar: 'hidden',
    pageScrollBox: 'p-0',
    page: 'p-0',
  },
};

export function mapClerkUserToProfile(user) {
  if (!user) {
    return null;
  }

  if (user.fullName && ('email' in user || 'phoneNumber' in user)) {
    return user;
  }

  return {
    fullName: {
      firstName: user.firstName || '',
      lastName: user.lastName || '',
    },
    email:
      user.primaryEmailAddress?.emailAddress ||
      user.emailAddresses?.[0]?.emailAddress ||
      '',
    phoneNumber:
      user.primaryPhoneNumber?.phoneNumber ||
      user.phoneNumbers?.[0]?.phoneNumber ||
      '',
    avatarUrl: user.imageUrl || '',
  };
}
