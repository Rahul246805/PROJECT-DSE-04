const { createClerkClient } = require('@clerk/express');
const userModel = require('../models/user.model');

function getClerkClient() {
    return createClerkClient({
        secretKey: process.env.CLERK_SECRET_KEY,
    });
}

function pickPrimaryEmail(clerkUser) {
    return clerkUser?.primaryEmailAddress?.emailAddress
        || clerkUser?.emailAddresses?.[0]?.emailAddress
        || '';
}

function pickPrimaryPhone(clerkUser) {
    return clerkUser?.primaryPhoneNumber?.phoneNumber
        || clerkUser?.phoneNumbers?.[0]?.phoneNumber
        || '';
}

function buildName(clerkUser) {
    const firstName = clerkUser?.firstName?.trim() || '';
    const lastName = clerkUser?.lastName?.trim() || '';

    if (firstName || lastName) {
        return {
            firstName,
            lastName,
        };
    }

    return {
        firstName: 'Mate',
        lastName: 'User',
    };
}

function buildAuthProvider(clerkUser) {
    const externalAccountProvider = clerkUser?.externalAccounts?.[0]?.provider;

    if (externalAccountProvider) {
        return externalAccountProvider;
    }

    if (pickPrimaryPhone(clerkUser)) {
        return 'phone_otp';
    }

    return 'clerk';
}

async function syncLocalUserFromClerk(clerkUserId) {
    if (!clerkUserId) {
        return null;
    }

    const clerkUser = await getClerkClient().users.getUser(clerkUserId);
    const email = pickPrimaryEmail(clerkUser);
    const phoneNumber = pickPrimaryPhone(clerkUser);
    const fullName = buildName(clerkUser);
    const avatarUrl = clerkUser?.imageUrl || '';
    const authProvider = buildAuthProvider(clerkUser);

    let localUser = await userModel.findOne({ clerkId: clerkUserId });

    if (!localUser && email) {
        localUser = await userModel.findOne({ email });
    }

    if (!localUser && phoneNumber) {
        localUser = await userModel.findOne({ phoneNumber });
    }

    if (!localUser) {
        localUser = new userModel({
            clerkId: clerkUserId,
            email: email || undefined,
            phoneNumber: phoneNumber || undefined,
            avatarUrl,
            authProvider,
            fullName,
            password: '',
        });
    } else {
        localUser.clerkId = clerkUserId;
        localUser.email = email || localUser.email;
        localUser.phoneNumber = phoneNumber || localUser.phoneNumber;
        localUser.avatarUrl = avatarUrl || localUser.avatarUrl;
        localUser.authProvider = authProvider;
        localUser.fullName = {
            firstName: fullName.firstName || localUser.fullName?.firstName || 'Mate',
            lastName: fullName.lastName || localUser.fullName?.lastName || 'User',
        };
    }

    await localUser.save();

    return {
        localUser,
        clerkUser,
    };
}

module.exports = {
    syncLocalUserFromClerk,
};
