# From Intention to Habit

Smart household savings for David and Amara.

## The problem

David and Amara are a young Nigerian couple. They want to save ₦2,000,000 in 12 months, but like most people they struggle to stay consistent. A savings plan is easy to set. Keeping it every month is the hard part.

## The solution

- A dashboard that shows monthly income, expenses, and savings rate in one place.
- A household goal with a target amount, target date, and progress.
- Contribution history with a simple chart and a consistency score.
- A pace tracker that compares the required monthly amount with the actual pace, projects the finish date, and shows a catch-up amount.
- AI insights with plain-English recommendations and next actions.
- An on-chain record on Celo Sepolia for creating a goal and recording contributions.

## AI integration

The frontend sends the goal, savings history, expenses, and pace numbers to the backend at `POST /ai/analyse-savings`. The backend holds the model key and calls the live model. The browser never sees the key.

The request has a 12-second limit. If the backend is down, slow, missing, or returns an error, the frontend automatically falls back to the Apidog mock response or to local rule-based analysis. The panel shows a **Live AI** or **Fallback** badge with a short reason, so the user always knows which one they are looking at.

No API key is present anywhere in the frontend code.

## Web3 integration

The app uses Celo Sepolia:

- Chain ID: `11142220`
- Contract: `0xf3bF2289BB778bE70829DC4E7C630db4B348f5DE`
- Explorer: `https://celo-sepolia.blockscout.com`

The contract functions used are:

- `createGoal(uint256 targetAmount, uint256 targetDate)`
- `getGoal()` for the current wallet's goal and recorded total
- `recordContribution(uint256 amount)`

The contract records numbers only. No real money moves, and the contract does not check whether a payment happened.

## Key decisions

- One wallet and one household goal keeps the first version simple.
- The pace tracker is the main differentiator. It shows required versus actual, the projected finish date, and the catch-up amount.
- Sample data keeps the dashboard usable when the mock API is down.
- API keys stay in backend environment variables only.

## Run it

Backend:

```bash
cd backend-main
npm install
cp .env.example .env
npm run dev
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Create a `.env` in the repo root for the frontend. Use placeholders like these:

```bash
VITE_API_BASE_URL=https://your-apidog-mock.example/
VITE_AI_API_URL=http://localhost:3000
VITE_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
VITE_CHAIN_ID=11142220
VITE_RPC_URL=https://forno.celo-sepolia.celo-testnet.org
VITE_EXPLORER_URL=https://celo-sepolia.blockscout.com
VITE_CONTRACT_ADDRESS=0xf3bF2289BB778bE70829DC4E7C630db4B348f5DE
```

Backend `.env` values:

```bash
AI_MODE=live
MISTRAL_API_KEY=your_mistral_key
MISTRAL_MODEL=your_model_name
FRONTEND_URL=http://localhost:5173
PORT=3000
CELO_RPC_URL=https://forno.celo-sepolia.celo-testnet.org
CONTRACT_ADDRESS=0xf3bF2289BB778bE70829DC4E7C630db4B348f5DE
WALLET_ADDRESS=0xYourWalletAddress
EVENTS_FROM_BLOCK=latest
```

If `AI_MODE` is not `live` or the key is missing, the backend returns its placeholder text and the frontend shows the fallback path.

## Limitations

- Testnet only. Nothing here is ready for real money.
- The household data is synthetic.
- The contract records values. It does not verify payments or move funds.
