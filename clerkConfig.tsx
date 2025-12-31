import { ClerkProvider } from '@clerk/clerk-react';
import { dark } from '@clerk/themes';

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!clerkPubKey) {
    throw new Error('Missing Clerk Publishable Key. Please check your .env.local file.');
}

// Custom appearance to match BookCircle's warm, cozy aesthetic
export const clerkAppearance = {
    baseTheme: undefined,
    variables: {
        colorPrimary: '#ff7a59', // Primary clay color
        colorBackground: '#fffcf9', // Warm background
        colorInputBackground: '#fffaf8',
        colorInputText: '#3e2723',
        colorText: '#3e2723',
        colorTextSecondary: '#8d6e63',
        fontFamily: "'Inter', sans-serif",
        fontFamilyButtons: "'Inter', sans-serif",
        borderRadius: '2rem',
        colorDanger: '#f48fb1',
        colorSuccess: '#7eb67d',
    },
    elements: {
        card: 'shadow-2xl border-4 border-[#fff5f0]',
        headerTitle: 'font-black text-3xl playfair text-[#3e2723]',
        headerSubtitle: 'text-[#ff7a59] font-bold uppercase text-xs tracking-widest',
        socialButtonsBlockButton: 'border-2 border-[#fff5f0] hover:border-[#ff7a59] rounded-2xl font-bold',
        formButtonPrimary: 'grad-sunset font-black text-lg rounded-2xl shadow-xl hover:scale-105 transition-all',
        formFieldInput: 'rounded-2xl border-2 border-[#fff5f0] bg-[#fffaf8] font-medium',
        footerActionLink: 'text-[#ff7a59] font-bold hover:text-[#ffc247]',
        identityPreviewText: 'font-bold',
        identityPreviewEditButton: 'text-[#ff7a59]',
    },
};

interface ClerkWrapperProps {
    children: React.ReactNode;
}

export function ClerkWrapper({ children }: ClerkWrapperProps) {
    return (
        <ClerkProvider
            publishableKey={clerkPubKey}
            appearance={clerkAppearance}
            // Integrate with Supabase JWT
            afterSignInUrl="/"
            afterSignUpUrl="/"
            signInUrl="/sign-in"
            signUpUrl="/sign-up"
        >
            {children}
        </ClerkProvider>
    );
}
