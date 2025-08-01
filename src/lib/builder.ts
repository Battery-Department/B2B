import { builder } from '@builder.io/sdk';

// Initialize Builder.io with your API key
// Get your API key from: https://builder.io/account/settings
builder.init(process.env.NEXT_PUBLIC_BUILDER_API_KEY || 'YOUR_API_KEY_HERE');

export { builder };