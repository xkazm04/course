# GitHub Organization Integration Guide

This guide explains how to automatically add users registered via GitHub OAuth to the **open-forge-courses** GitHub organization.

## Overview

When users sign up to OpenForge using GitHub OAuth, they will automatically receive an invitation to join the `open-forge-courses` GitHub organization as members. This enables:
- Access to course repositories
- Collaboration on community projects
- Portfolio building with organization affiliation

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   User Signs    │     │   Supabase      │     │   GitHub App    │
│   in with       │────>│   OAuth +       │────>│   (Server)      │
│   GitHub        │     │   Auth Callback │     │   Send Invite   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

**Two-Step Process:**
1. **Supabase OAuth** - Handles GitHub authentication and user creation
2. **GitHub App** - Sends organization invitation via API (server-side)

## Step 1: Enable GitHub OAuth in Supabase

### 1.1 Create a GitHub OAuth App (for Supabase Auth)

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **OAuth Apps** > **New OAuth App**
3. Fill in the details:
   - **Application name**: `OpenForge`
   - **Homepage URL**: `https://your-domain.com`
   - **Authorization callback URL**: `https://your-supabase-project.supabase.co/auth/v1/callback`
4. Click **Register application**
5. Copy the **Client ID**
6. Generate and copy a **Client Secret**

### 1.2 Configure Supabase

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to **Authentication** > **Providers**
3. Enable **GitHub**
4. Enter the Client ID and Client Secret from step 1.1
5. Save changes

### 1.3 Required OAuth Scopes

Supabase requests these scopes by default:
- `read:user` - Read user profile data
- `user:email` - Access user email addresses

No additional scopes are needed for basic authentication.

## Step 2: Create a GitHub App (for Organization Invitations)

> **Why a GitHub App instead of OAuth App?**
> - GitHub Apps can act independently (server-to-server)
> - Fine-grained permissions (only "Members: write")
> - Higher rate limits (500 invites/day for paid orgs)
> - Short-lived tokens (more secure)

### 2.1 Create the GitHub App

1. Go to [GitHub Developer Settings](https://github.com/settings/apps)
2. Click **New GitHub App**
3. Fill in the basic info:
   - **GitHub App name**: `OpenForge Org Manager`
   - **Homepage URL**: `https://your-domain.com`
   - **Webhook**: Uncheck "Active" (not needed)

4. Set **Permissions**:
   - Under **Organization permissions**:
     - **Members**: `Read and write`
   - Leave all other permissions as "No access"

5. Under **Where can this GitHub App be installed?**:
   - Select **Only on this account**

6. Click **Create GitHub App**

### 2.2 Generate Private Key

1. After creating the app, scroll to **Private keys**
2. Click **Generate a private key**
3. Download the `.pem` file - **store securely!**

### 2.3 Install the App on Your Organization

1. Go to the GitHub App settings page
2. Click **Install App** in the left sidebar
3. Select the **open-forge-courses** organization
4. Click **Install**

### 2.4 Note the App Credentials

You'll need:
- **App ID**: Found at the top of the app settings page
- **Installation ID**: From the URL after installing (github.com/organizations/open-forge-courses/settings/installations/**XXXXX**)
- **Private Key**: The `.pem` file you downloaded

## Step 3: Environment Configuration

Add these environment variables to your `.env.local`:

```env
# GitHub OAuth (for Supabase - already configured)
GITHUB_CLIENT_ID=your_oauth_client_id
GITHUB_CLIENT_SECRET=your_oauth_client_secret

# GitHub App (for Organization Invitations)
GITHUB_APP_ID=your_app_id
GITHUB_APP_INSTALLATION_ID=your_installation_id
GITHUB_APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"
GITHUB_ORG_NAME=open-forge-courses
```

> **Note**: For the private key, either:
> - Store as a single line with `\n` for newlines, or
> - Store as a file path and read it in code

## Step 4: Implementation

### 4.1 Install Dependencies

```bash
npm install @octokit/auth-app @octokit/rest
```

### 4.2 Create GitHub Service

Create `src/lib/github/organizationService.ts`:

```typescript
import { createAppAuth } from "@octokit/auth-app";
import { Octokit } from "@octokit/rest";

const appId = process.env.GITHUB_APP_ID!;
const installationId = process.env.GITHUB_APP_INSTALLATION_ID!;
const privateKey = process.env.GITHUB_APP_PRIVATE_KEY!;
const orgName = process.env.GITHUB_ORG_NAME || "open-forge-courses";

/**
 * Creates an authenticated Octokit instance using the GitHub App
 */
async function getOctokit(): Promise<Octokit> {
    const auth = createAppAuth({
        appId,
        privateKey,
        installationId,
    });

    const installationAuthentication = await auth({ type: "installation" });

    return new Octokit({
        auth: installationAuthentication.token,
    });
}

/**
 * Invites a GitHub user to the organization
 * @param githubUsername - The GitHub username to invite
 * @returns The invitation result or error
 */
export async function inviteToOrganization(
    githubUsername: string
): Promise<{ success: boolean; message: string; invitationId?: number }> {
    try {
        const octokit = await getOctokit();

        // First, get the user's GitHub ID
        const { data: user } = await octokit.users.getByUsername({
            username: githubUsername,
        });

        // Check if already a member
        try {
            const { data: membership } = await octokit.orgs.getMembershipForUser({
                org: orgName,
                username: githubUsername,
            });

            if (membership.state === "active") {
                return {
                    success: true,
                    message: "User is already a member of the organization",
                };
            }

            if (membership.state === "pending") {
                return {
                    success: true,
                    message: "User already has a pending invitation",
                };
            }
        } catch (error: any) {
            // 404 means not a member, which is expected
            if (error.status !== 404) {
                throw error;
            }
        }

        // Create the invitation
        const { data: invitation } = await octokit.orgs.createInvitation({
            org: orgName,
            invitee_id: user.id,
            role: "direct_member",
        });

        return {
            success: true,
            message: "Invitation sent successfully",
            invitationId: invitation.id,
        };
    } catch (error: any) {
        console.error("Failed to invite user to organization:", error);

        // Handle specific error cases
        if (error.status === 422) {
            return {
                success: false,
                message: "User cannot be invited (may have blocked the org or already declined)",
            };
        }

        if (error.status === 403) {
            return {
                success: false,
                message: "Rate limit exceeded or insufficient permissions",
            };
        }

        return {
            success: false,
            message: error.message || "Failed to send invitation",
        };
    }
}

/**
 * Checks if a user is a member of the organization
 */
export async function checkMembership(
    githubUsername: string
): Promise<{ isMember: boolean; state: string | null }> {
    try {
        const octokit = await getOctokit();

        const { data: membership } = await octokit.orgs.getMembershipForUser({
            org: orgName,
            username: githubUsername,
        });

        return {
            isMember: membership.state === "active",
            state: membership.state,
        };
    } catch (error: any) {
        if (error.status === 404) {
            return { isMember: false, state: null };
        }
        throw error;
    }
}
```

### 4.3 Update Auth Callback

Modify `src/app/auth/callback/route.ts` to send organization invitation:

```typescript
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { inviteToOrganization } from "@/lib/github/organizationService";

export async function GET(request: Request) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get("code");
    const next = requestUrl.searchParams.get("next") ?? "/forge";

    if (code) {
        const supabase = await createClient();
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error) {
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                // Check if this is a GitHub OAuth login
                const isGitHubAuth = user.app_metadata?.provider === "github";
                const githubUsername = user.user_metadata?.user_name;

                // Create or update profile
                const { data: profile } = await supabase
                    .from("user_profiles")
                    .select("id, github_username, github_org_invited")
                    .eq("id", user.id)
                    .single();

                if (!profile) {
                    // Create new profile
                    await supabase.from("user_profiles").insert({
                        id: user.id,
                        email: user.email,
                        display_name: user.user_metadata?.full_name ||
                                     user.user_metadata?.name ||
                                     user.email?.split("@")[0] || "User",
                        avatar_url: user.user_metadata?.avatar_url || null,
                        github_username: isGitHubAuth ? githubUsername : null,
                        total_xp: 0,
                        current_level: 1,
                        current_streak: 0,
                        longest_streak: 0,
                    });

                    // Send organization invitation for new GitHub users
                    if (isGitHubAuth && githubUsername) {
                        const result = await inviteToOrganization(githubUsername);

                        if (result.success) {
                            await supabase
                                .from("user_profiles")
                                .update({ github_org_invited: true })
                                .eq("id", user.id);
                        }

                        console.log(`GitHub org invitation for ${githubUsername}:`, result.message);
                    }
                } else if (isGitHubAuth && githubUsername && !profile.github_org_invited) {
                    // Existing user logging in with GitHub for first time
                    const result = await inviteToOrganization(githubUsername);

                    if (result.success) {
                        await supabase
                            .from("user_profiles")
                            .update({
                                github_username: githubUsername,
                                github_org_invited: true
                            })
                            .eq("id", user.id);
                    }
                }
            }

            return NextResponse.redirect(new URL(next, requestUrl.origin));
        }
    }

    return NextResponse.redirect(new URL("/forge?error=auth", requestUrl.origin));
}
```

### 4.4 Database Migration

Add columns to track GitHub integration:

```sql
-- Add GitHub-related columns to user_profiles
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS github_username VARCHAR(255),
ADD COLUMN IF NOT EXISTS github_org_invited BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS github_org_member BOOLEAN DEFAULT FALSE;

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_github_username
ON user_profiles(github_username);
```

## Step 5: Add GitHub OAuth to Frontend

### 5.1 Update useAuth Hook

Add `signInWithGitHub` to `src/app/shared/hooks/useAuth.ts`:

```typescript
// Add alongside existing signInWithGoogle
const signInWithGitHub = useCallback(async (redirectTo?: string) => {
    const { error } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
            redirectTo: `${window.location.origin}/auth/callback${
                redirectTo ? `?next=${encodeURIComponent(redirectTo)}` : ""
            }`,
        },
    });

    if (error) {
        setState(prev => ({ ...prev, error }));
    }
}, [supabase]);

// Export in the return object
return {
    // ... existing exports
    signInWithGitHub,
};
```

### 5.2 Add GitHub Sign-In Button

Add to sign-in UI (e.g., profile page):

```tsx
<button
    onClick={() => signInWithGitHub("/forge")}
    className="flex items-center gap-3 px-6 py-3 rounded-xl bg-gray-900 text-white font-medium hover:bg-gray-800 transition-colors"
>
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
    </svg>
    Sign in with GitHub
</button>
```

## Rate Limits & Considerations

### Invitation Limits
- **New orgs (< 1 month) or free plan**: 50 invitations per 24 hours
- **Established orgs (> 1 month) or paid plan**: 500 invitations per 24 hours

### Best Practices
1. **Track invitation status** - Don't re-invite users who already have pending invites
2. **Handle declined invitations** - Users who decline can't be re-invited for 90 days
3. **Log all invitation attempts** - For debugging and audit purposes
4. **Graceful degradation** - App should work even if invitation fails

## Testing

### Test the GitHub App Manually

```bash
# Generate a JWT for testing (requires jwt-cli or similar)
# Or use the Octokit library in a test script

# Test invitation endpoint
curl -X POST \
  -H "Authorization: Bearer YOUR_INSTALLATION_TOKEN" \
  -H "Accept: application/vnd.github+json" \
  https://api.github.com/orgs/open-forge-courses/invitations \
  -d '{"invitee_id": USER_ID, "role": "direct_member"}'
```

### Integration Test

Create `src/lib/github/__tests__/organizationService.test.ts`:

```typescript
import { inviteToOrganization, checkMembership } from "../organizationService";

describe("GitHub Organization Service", () => {
    // Only run in test environment with real credentials
    const testUsername = process.env.TEST_GITHUB_USERNAME;

    it.skip("should check membership status", async () => {
        if (!testUsername) return;

        const result = await checkMembership(testUsername);
        expect(result).toHaveProperty("isMember");
        expect(result).toHaveProperty("state");
    });

    it.skip("should handle invitation for existing member", async () => {
        if (!testUsername) return;

        const result = await inviteToOrganization(testUsername);
        expect(result.success).toBe(true);
    });
});
```

## Troubleshooting

### Common Issues

1. **"Bad credentials" error**
   - Verify App ID and Installation ID are correct
   - Check that private key is properly formatted (including newlines)
   - Ensure the app is installed on the organization

2. **"Resource not accessible by integration" error**
   - The GitHub App needs "Members: write" permission
   - Reinstall the app after changing permissions

3. **User can't be invited**
   - User may have blocked the organization
   - User may have declined a previous invitation (90-day cooldown)
   - Check if user has email visibility set to private

4. **Rate limit exceeded**
   - Wait for the 24-hour window to reset
   - Consider upgrading to a paid organization plan

## Security Notes

1. **Never expose the private key** - Store in environment variables or secrets manager
2. **Validate user input** - Sanitize GitHub usernames before API calls
3. **Use HTTPS only** - All GitHub API calls should be over HTTPS
4. **Rotate keys periodically** - Generate new private keys every 6-12 months
5. **Monitor API usage** - Set up alerts for unusual invitation patterns

## References

- [GitHub REST API - Organization Members](https://docs.github.com/en/rest/orgs/members)
- [Creating a GitHub App](https://docs.github.com/en/apps/creating-github-apps)
- [GitHub App Authentication](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app)
- [Supabase Auth - GitHub Provider](https://supabase.com/docs/guides/auth/social-login/auth-github)
