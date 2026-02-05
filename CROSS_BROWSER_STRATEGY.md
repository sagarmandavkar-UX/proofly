# Proofly Cross-Browser Strategy

## Overview

Proofly currently uses Chrome's Built-in AI API for on-device processing. To expand beyond Chrome, we implement three complementary approaches:

1. **Fallback Cloud Models** (with explicit opt-in)
2. **Web Version** (paste-based proofreading)
3. **WebExtensions API** (Firefox, Edge, Safari)

Each approach maintains privacy-first principles while expanding platform coverage.

---

## Approach 1: Fallback Cloud-Based Models (with Explicit Opt-In)

### Philosophy
**"Local-first, cloud-optional"**

When Chrome's API isn't available, users can opt-in to cloud processing.

### Implementation

#### Detect Environment
```javascript
const hasLocalAI = () => {
  return window.ai && window.ai.languageModel;
};
```

#### User Choice Flow
```
1. Check: Does browser support local AI API?
2. If NO:
   a. Show warning: "Cloud processing required"
   b. Display privacy notice with data handling details
   c. Get explicit user opt-in (checkbox + button)
   d. Only proceed if user confirms
```

### Privacy Safeguards

#### Explicit Opt-In Required
- Checkbox: "I understand my text will be sent to Proofly's cloud servers"
- Clear explanation of what data is sent
- Data retention policy (processed immediately, not stored)
- Option to review before sending

#### Transparent Communication
- Badge: "Cloud Processing" (visible in UI)
- Clear indicator: "Your text is being analyzed on a remote server"
- Option to switch back to local-only when available

#### Data Policy
- **No storage**: Text is processed and immediately deleted
- **No tracking**: Cloud requests don't build profiles
- **No resale**: Data never used for model training
- **Optional logging**: Users can disable all logging
- **Encryption**: Text transmitted over HTTPS only

### Supported Cloud Providers (Priority Order)

#### 1. Proofly's Own Cloud (Preferred)
- Minimal infrastructure ($500/month)
- Simple API endpoint
- Full control over data
- Can shut down if needed (users have local fallback)

#### 2. OpenAI API (Fallback)
- Proven reliability
- GPT-4 for advanced corrections
- Clear privacy terms
- User can self-host API key

#### 3. Google Cloud NLP (Fallback)
- Familiar to Chrome users
- Good performance
- Standardized billing
- User controls API key

### Implementation Details

#### API Endpoint Design
```
POST /api/v1/proofread
Headers:
  Authorization: Bearer {user-api-key-optional}
  X-Processing-Mode: cloud
  X-User-Consent: true

Body:
{
  text: "string",
  mode: "grammar" | "clarity",
  delete_after_processing: true
}

Response:
{
  suggestions: [...],
  timestamp: null,  // Proof no tracking
  delete_after: "now"
}
```

### Cost Model

#### Proofly Cloud
- First 100 requests/month: FREE
- Each additional request: $0.001
- Bulk plans: $5/month for 10K requests

#### User Controls
- Set monthly request limit
- Choose processing mode (local preferred, cloud only when needed)
- Review all cloud requests
- Delete request history

### Why This Works

✅ Users stay in control (explicit opt-in)  
✅ Privacy-first (local preferred, cloud optional)  
✅ Transparent (users know when data leaves device)  
✅ Cost-effective (users pay only for what they use)  
✅ Sustainable (cloud revenue supports development)  

---

## Approach 2: Web Version (Paste-Based Proofreading)

### Philosophy
**"Proofly everywhere, for everyone"**

A simple web interface at `proofly.app` for users who:
- Can't install extensions
- Want one-time proofreading
- Prefer no data persistence
- Use browsers without extension support

### Implementation

#### Core Features

1. **Paste Text Area**
   - Large textarea for pasting text
   - Auto-save drafts to localStorage (local only)
   - Clear button to erase all

2. **Proofread Button**
   - Analyzes pasted text
   - Tries local AI first (Chrome, Edge)
   - Falls back to cloud if needed (with consent)

3. **Results Display**
   - Inline suggestions with explanations
   - Color-coded error types
   - One-click corrections
   - Copy corrected text button

4. **Export Options**
   - Copy to clipboard
   - Download as .txt
   - Download as .docx
   - Email corrected version (optional)

#### Architecture

```
Frontend (SvelteKit / React)
  ├── Text input
  ├── Local AI detection
  ├── Cloud fallback handler
  └── Results display

Backend (Optional)
  ├── Cloud proofreading API
  ├── Rate limiting
  ├── Billing/free tier tracking
  └── Analytics (opt-in only)
```

#### Privacy Model

**Local-First Processing**
- If browser supports local AI: Everything stays on device
- Drafts saved to localStorage (not uploaded)
- User controls everything

**Cloud Processing (Optional)**
- User explicitly chooses to send text
- Clear warning: "Your text will be sent to our servers"
- No automatic processing
- Can choose self-hosted API key

#### Free Tier

- 50 documents/month free (local only)
- 10 documents/month with cloud processing
- No signup required
- No tracking

#### Paid Tier (Optional)

- Unlimited documents
- Advanced features (readability, tone)
- Custom API integration
- Email export

### Why This Works

✅ Accessible to everyone  
✅ No installation required  
✅ Privacy-first (local default)  
✅ Fast adoption (low barrier)  
✅ Drives browser extension adoption  

---

## Approach 3: WebExtensions API Support (Firefox, Edge, Safari)

### Philosophy
**"One codebase, multiple browsers"**

Use WebExtensions standard to support Firefox, Edge, and Safari with minimal code changes.

### Implementation

#### Compatibility Matrix

| Browser | Local AI | WebExtensions | Status |
|---------|----------|---------------|--------|
| Chrome | ✅ Built-in API | ✅ Full support | Primary |
| Edge | ✅ Built-in API | ✅ Full support | Phase 1 |
| Firefox | ❌ Not available | ✅ Full support | Phase 2 |
| Safari | ❌ Not available | ⚠️ Limited | Phase 3 |

#### WebExtensions Adaptation

**Manifest V3 Compatibility**
```json
{
  "manifest_version": 3,
  "host_permissions": [
    "<all_urls>"
  ],
  "permissions": [
    "storage",
    "scripting",
    "contextMenus"
  ]
}
```

#### Local AI Detection

```javascript
// Chrome/Edge with local AI
if (window.ai?.languageModel) {
  useLocalAI();
} else if (browser.runtime.id) {
  // Firefox/Safari: Use cloud with consent
  showCloudConsentModal();
  useCloudAPI();
}
```

#### Firefox-Specific Implementation

**Challenges**
- No local Gemini Nano API
- Limited WebExtensions APIs
- Private browsing restrictions

**Solutions**
- Cloud proofreading as default
- Explicit user consent on first use
- Store settings in browser.storage.sync
- Graceful degradation in private mode

### Browser-Specific Considerations

#### Edge
- Same as Chrome (uses Chromium)
- Local AI API available
- WebExtensions fully supported
- Submission to Edge Add-ons store

#### Firefox
- No local AI API yet
- Full WebExtensions support
- Submission to Mozilla Add-ons
- Good privacy reputation (aligns with Proofly)
- Consider opt-in cloud model

#### Safari
- Limited WebExtensions support
- Web version + bookmarklet
- Desktop app consideration
- iOS/iPadOS version possible

### Implementation Timeline

#### Phase 1 (Q1 2026): Edge Support
- Minimal changes (Chromium-based)
- Same local AI API works
- Edge Store submission

#### Phase 2 (Q2 2026): Firefox Support
- WebExtensions implementation
- Cloud fallback with opt-in
- Mozilla Add-ons submission
- Heavy testing for privacy compliance

#### Phase 3 (Q3 2026): Safari Support
- Web version primary
- Safari bookmarklet
- Consider native app

### Code Structure

```
src/
  ├── common/           # Shared code
  │   ├── ai/           # AI abstraction
  │   ├── privacy/      # Privacy checks
  │   └── ui/           # UI components
  ├── chrome/           # Chrome-specific
  ├── firefox/          # Firefox-specific
  ├── edge/             # Edge-specific
  ├── safari/           # Safari-specific
  └── web/              # Web version
```

### Privacy Parity

**All platforms maintain the same privacy principles:**

✅ Local processing preferred  
✅ Explicit consent required for cloud  
✅ No data storage  
✅ No tracking or profiling  
✅ User controls everything  
✅ Open source code  

---

## Comparison: The Three Approaches

| Aspect | Cloud Fallback | Web Version | WebExtensions |
|--------|---|---|---|
| **Setup** | Install extension | Visit proofly.app | Install extension |
| **Local AI** | Yes (Chrome/Edge) | Yes (Chrome/Edge) | Yes (Chrome/Edge) |
| **Cloud Support** | Optional with consent | Optional with consent | Optional with consent |
| **Browser Support** | Chrome, Edge | All browsers | Chrome, Edge, Firefox, Safari |
| **Data Persistence** | None | localStorage (user's device) | None |
| **Use Case** | Daily writing | One-off corrections | Daily writing |
| **Accessibility** | Moderate | High | Moderate |
| **Cost** | Low | Low | Low |

---

## Rollout Strategy

### Phase 1 (Now): Chrome + Cloud Fallback
- Chrome extension with local AI
- Cloud fallback API with opt-in
- Web version beta at proofly.app

### Phase 2 (Q1 2026): Web + Edge
- Public web version launch
- Edge extension submission
- Cloud processing fully operational

### Phase 3 (Q2 2026): Firefox Support
- Firefox WebExtensions implementation
- Mozilla Add-ons submission
- Cloud model optimization for Firefox users

### Phase 4 (Q3 2026): Safari + Mobile
- Safari bookmarklet
- Consider native iOS app
- Mobile web optimization

---

## Risk Mitigation

### Cloud Provider Risk
**Risk**: Cloud service goes down
**Mitigation**: 
- Local fallback always available
- Self-hosted API key support
- User can switch backends anytime
- Users not dependent on Proofly's cloud

### Privacy Risk
**Risk**: User accidentally sends sensitive data to cloud
**Mitigation**:
- Explicit consent UI (no dark patterns)
- Clear warnings on every cloud request
- Option to review text before sending
- No automatic cloud processing
- Audit trail of all requests

### Market Risk
**Risk**: Grammarly supports WebExtensions better
**Mitigation**:
- Focus on privacy + clarity differentiator
- Lower barrier to entry (web version)
- Clear cost advantage
- Target students + privacy-conscious users

---

## Success Metrics

### Adoption
- Chrome extension: 10K+ users (Q2 2026)
- Web version: 5K+ monthly visitors (Q2 2026)
- Firefox extension: 2K+ users (Q3 2026)
- Edge extension: 3K+ users (Q3 2026)

### Privacy
- 0% unintended cloud requests
- 100% explicit consent for cloud
- 0% data leaks or breaches
- Community audit passed

### Engagement
- 30%+ of users enable cloud (show high value)
- 50%+ web version users upgrade to extension
- 70%+ retention (users keep using)
- Avg 5+ corrections per user per month

---

## Conclusion

The three-pronged approach balances:

1. **Privacy** - Local-first, opt-in cloud
2. **Accessibility** - Available on all platforms
3. **Sustainability** - Optional cloud revenue
4. **Simplicity** - Single codebase, multiple platforms

Users get choice, control, and clarity - regardless of browser.
