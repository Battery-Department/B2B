# Battery Department - Custom Battery E-commerce Platform

A comprehensive B2B e-commerce platform specializing in custom-engraved FlexVolt batteries for contractors, featuring AI-powered design tools and QR-based theft protection.

## 🚀 Features

- **🔋 Custom Laser Engraving**: Personalize FlexVolt batteries with company name and contact info
- **🛡️ QR Theft Protection**: Every battery includes a unique QR code linking to owner information
- **🤖 AI Design Assistant**: Natural language battery customization powered by Claude
- **💰 10% Deposit System**: Lock in orders with just 10% down
- **📱 Mobile-First Design**: Fully responsive interface optimized for contractors on the go
- **🎥 360° Preview**: See your custom battery from every angle before ordering

## 🛠️ Tech Stack

- **Frontend**: Next.js 14.2.30, React 18, TypeScript
- **Styling**: Tailwind CSS, Framer Motion
- **State Management**: Zustand
- **Canvas Rendering**: HTML5 Canvas for real-time battery preview
- **AI Integration**: Anthropic Claude API
- **Database**: PostgreSQL with Prisma ORM
- **Payment**: Stripe (integration ready)
- **Deployment**: Vercel

## 🏁 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- PostgreSQL database
- Anthropic API key (for AI features)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/YOUR_USERNAME/battery-dashboard.git
cd battery-dashboard
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:
```env
# Database
DATABASE_URL="your-postgres-connection-string"

# AI Integration
ANTHROPIC_API_KEY="your-anthropic-api-key"

# Stripe (when ready)
STRIPE_SECRET_KEY="your-stripe-secret"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="your-stripe-publishable"

# Features
NEXT_PUBLIC_AI_FEATURES_ENABLED=true
```

4. Set up the database:
```bash
npx prisma generate
npx prisma db push
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000)

## 📱 Key Pages

- `/` - Landing page
- `/customer/design-with-ai` - AI-powered design interface
- `/customer/engraving` - Manual battery customization
- `/customer/cart` - Shopping cart with visual previews
- `/customer/checkout` - Streamlined checkout with 10% deposit
- `/battery-tracking-demo` - Interactive QR protection demonstration

## 🏗️ Project Structure

```
/src
├── app/                    # Next.js app router pages
│   ├── customer/          # Customer-facing pages
│   └── api/              # API endpoints
├── components/           # React components
│   ├── engraving/       # Battery customization components
│   ├── tracking/        # QR tracking demo components
│   └── layout/          # Layout components
├── lib/                 # Utilities and stores
└── styles/             # Global styles
```

## 🎨 Design System

- **Primary Blue**: `#006FEE`
- **Dark Blue**: `#0050B3`
- **Success Green**: `#10B981`
- **Font**: Poppins for headings, system fonts for body
- **Spacing**: 4px grid system
- **Animations**: Framer Motion with 0.3s transitions

## 💰 Pricing

| Model | Capacity | Retail Price | 10% Deposit |
|-------|----------|--------------|-------------|
| FlexVolt | 6Ah | $149 | $14.90 |
| FlexVolt | 9Ah | $239 | $23.90 |
| FlexVolt | 15Ah | $359 | $35.90 |

**Volume Discounts**:
- 10% off orders over $1,000
- 15% off orders over $2,500
- 20% off orders over $5,000

## 📖 Documentation

- [`docs/BATTERY_DEPARTMENT_TRAINING_DATA.json`](docs/BATTERY_DEPARTMENT_TRAINING_DATA.json) - Comprehensive business model documentation
- [`docs/BATTERY_TRACKING_MODAL_GUIDE.md`](docs/BATTERY_TRACKING_MODAL_GUIDE.md) - Modal implementation guide
- [`GITHUB_SETUP.md`](GITHUB_SETUP.md) - GitHub deployment guide

## 🚀 Deployment

The application is configured for deployment on Vercel:

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test

# Run linting
npm run lint

# Type checking
npm run type-check
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is proprietary software. All rights reserved.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- AI powered by [Anthropic Claude](https://www.anthropic.com/)
- Payments by [Stripe](https://stripe.com/)
- Deployed on [Vercel](https://vercel.com/)

---

**Battery Department** - Professional Power Tools. Protected.

For support, email: support@batterydpt.com