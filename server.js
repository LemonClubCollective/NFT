const express = require('express');
const { Connection, PublicKey, Keypair, LAMPORTS_PER_SOL } = require('@solana/web3.js');
const { Metaplex, keypairIdentity, sol } = require('@metaplex-foundation/js');
const fs = require('fs').promises;
const path = require('path');
const { createCanvas, loadImage } = require('canvas');
const app = express();
const port = 3000;

const PRIMARY_RPC = 'https://api.devnet.solana.com';
const FALLBACK_RPC = 'https://rpc.ankr.com/solana_devnet';
let connection = new Connection(PRIMARY_RPC, 'confirmed');

async function retryRPC(operation, maxAttempts = 5, delay = 1000) {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await operation();
        } catch (error) {
            if (error.message.includes('429 Too Many Requests') || error.message.includes('timeout')) {
                console.log(`RPC failed: ${error.message}. Retrying after ${delay * attempt}ms...`);
                if (attempt === maxAttempts) {
                    console.log('Switching to fallback RPC...');
                    connection = new Connection(FALLBACK_RPC, 'confirmed');
                    return await operation();
                }
                await new Promise(resolve => setTimeout(resolve, delay * attempt));
            } else {
                throw error;
            }
        }
    }
}

async function loadWallet() {
    const walletData = await fs.readFile('C:\\Users\\public.DESKTOP-1IFDKN4\\solana\\dev-wallet.json', 'utf8');
    return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(walletData)));
}

const USERS_FILE = 'users.json';
const POSTS_FILE = 'posts.json';

async function initialize() {
    const wallet = await loadWallet();
    const metaplex = Metaplex.make(connection).use(keypairIdentity(wallet));

    let users = {};
    let posts = [];
    try {
        users = JSON.parse(await fs.readFile(USERS_FILE, 'utf8')) || {};
        posts = JSON.parse(await fs.readFile(POSTS_FILE, 'utf8')) || [];
    } catch (error) {
        console.log('[Init] No existing data files, starting fresh');
    }

    function saveData() {
        try {
            fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
            fs.writeFile(POSTS_FILE, JSON.stringify(posts, null, 2));
            console.log('[SaveData] Data saved successfully');
        } catch (error) {
            console.error('[SaveData] Error saving data:', error.message);
        }
    }

    const nftLayers = {
        backgrounds: [
            'https://raw.githubusercontent.com/LemonClubCollective/NFT/main/BGsunset.png',
            'https://raw.githubusercontent.com/LemonClubCollective/NFT/main/BGsunsetforest1.png',
            'https://raw.githubusercontent.com/LemonClubCollective/NFT/main/BGstars.png',
            'https://raw.githubusercontent.com/LemonClubCollective/NFT/main/BGstars1.png',
            'https://raw.githubusercontent.com/LemonClubCollective/NFT/main/BGnightforest.png',
            'https://raw.githubusercontent.com/LemonClubCollective/NFT/main/BGnightforest1.png',
            'https://raw.githubusercontent.com/LemonClubCollective/NFT/main/BGgreengrass.png',
            'https://raw.githubusercontent.com/LemonClubCollective/NFT/main/BGgrassfield.png',
            'https://raw.githubusercontent.com/LemonClubCollective/NFT/main/BGgrassfieldswirl.png',
            'https://raw.githubusercontent.com/LemonClubCollective/NFT/main/BGforestsunset.png',
            'https://raw.githubusercontent.com/LemonClubCollective/NFT/main/BGanimesunset.png',
            'https://raw.githubusercontent.com/LemonClubCollective/NFT/main/BGcloudsevening.png',
            'https://raw.githubusercontent.com/LemonClubCollective/NFT/main/BGforestgrass.png'
        ],
        seed: [
            'https://raw.githubusercontent.com/LemonClubCollective/NFT/main/brownseed.png',
            'https://raw.githubusercontent.com/LemonClubCollective/NFT/main/magicseed.png',
            'https://raw.githubusercontent.com/LemonClubCollective/NFT/main/magicseed1.png',
            'https://raw.githubusercontent.com/LemonClubCollective/NFT/main/magicseed2.png',
            'https://raw.githubusercontent.com/LemonClubCollective/NFT/main/purpleseed.png',
            'https://raw.githubusercontent.com/LemonClubCollective/NFT/main/purpleseed1.png',
            'https://raw.githubusercontent.com/LemonClubCollective/NFT/main/purpleseed3.png',
            'https://raw.githubusercontent.com/LemonClubCollective/NFT/main/greenseed.png'
        ],
        sprout: [
            'https://raw.githubusercontent.com/LemonClubCollective/NFT/main/sprout.png',
            'https://raw.githubusercontent.com/LemonClubCollective/NFT/main/magicsprout.png',
            'https://raw.githubusercontent.com/LemonClubCollective/NFT/main/magicsprout1.png',
            'https://raw.githubusercontent.com/LemonClubCollective/NFT/main/greensprout.png',
            'https://raw.githubusercontent.com/LemonClubCollective/NFT/main/greensprout2.png',
            'https://raw.githubusercontent.com/LemonClubCollective/NFT/main/purplesprout.png',
            'https://raw.githubusercontent.com/LemonClubCollective/NFT/main/purplesprout1.png',
            'https://raw.githubusercontent.com/LemonClubCollective/NFT/main/purplesprout2.png'
        ],
        sapling: [
            'https://raw.githubusercontent.com/LemonClubCollective/NFT/main/sapling.png',
            'https://raw.githubusercontent.com/LemonClubCollective/NFT/main/greensapling.png',
            'https://raw.githubusercontent.com/LemonClubCollective/NFT/main/purplesapling.png',
            'https://raw.githubusercontent.com/LemonClubCollective/NFT/main/purplesapling1.png',
            'https://raw.githubusercontent.com/LemonClubCollective/NFT/main/purplesapling2.png',
            'https://raw.githubusercontent.com/LemonClubCollective/NFT/main/redrubysapling.png',
            'https://raw.githubusercontent.com/LemonClubCollective/NFT/main/redrubysapling2.png',
            'https://raw.githubusercontent.com/LemonClubCollective/NFT/main/redrubysapling3.png',
            'https://raw.githubusercontent.com/LemonClubCollective/NFT/main/goldensapling.png',
            'https://raw.githubusercontent.com/LemonClubCollective/NFT/main/goldensapling1.png',
            'https://raw.githubusercontent.com/LemonClubCollective/NFT/main/goldensapling2.png'
        ],
        tree: [
            'https://raw.githubusercontent.com/LemonClubCollective/NFT/main/goldentree.png',
            'https://raw.githubusercontent.com/LemonClubCollective/NFT/main/emeraldtree.png',
            'https://raw.githubusercontent.com/LemonClubCollective/NFT/main/purpletree.png',
            'https://raw.githubusercontent.com/LemonClubCollective/NFT/main/purpletree1.png',
            'https://raw.githubusercontent.com/LemonClubCollective/NFT/main/redtree.png',
            'https://raw.githubusercontent.com/LemonClubCollective/NFT/main/redtree1.png',
            'https://raw.githubusercontent.com/LemonClubCollective/NFT/main/redtree2.png',
            'https://raw.githubusercontent.com/LemonClubCollective/NFT/main/goldtree1.png',
            'https://raw.githubusercontent.com/LemonClubCollective/NFT/main/goldtree2.png',
            'https://raw.githubusercontent.com/LemonClubCollective/NFT/main/goldentree3.png',
            'https://raw.githubusercontent.com/LemonClubCollective/NFT/main/diamondtree.png'
        ]
    };

    const quests = {
    daily: [
        { id: 'lemon-picker', name: 'Lemon Picker', desc: 'Mint 1 NFT', goal: 1, reward: 50 },
        { id: 'community-zest', name: 'Community Zest', desc: 'Submit 1 forum post', goal: 1, reward: 25 },
        { id: 'social-squeeze', name: 'Social Squeeze', desc: 'Visit 2 social media links', goal: 2, reward: 20 }
    ],
    weekly: [
        { id: 'grove-keeper', name: 'Grove Keeper', desc: 'Stake 3 NFTs', goal: 3, reward: 200 },
        { id: 'lemon-bard', name: 'Lemon Bard', desc: 'Post 5 comments or posts', goal: 5, reward: 150 },
        { id: 'visit-sections', name: 'Citrus Explorer', desc: 'Visit all 7 sections', goal: 7, reward: 100 }
    ],
    limited: [
        { id: 'million-lemon-bash', name: 'Million Lemon Bash', desc: 'Evolve 2 NFTs', goal: 2, reward: 500 }
    ]
};

    function getRandomItem(array, rarityRules = null) {
        if (!array || array.length === 0) {
            throw new Error('No items available in array for random selection');
        }
        if (rarityRules) {
            const totalWeight = Object.values(rarityRules).reduce((sum, weight) => sum + weight, 0);
            const rand = Math.random() * totalWeight;
            let weightSum = 0;
            for (const [color, weight] of Object.entries(rarityRules)) {
                weightSum += weight;
                if (rand <= weightSum) {
                    const filtered = array.filter(item => item.includes(color));
                    return filtered[Math.floor(Math.random() * filtered.length)] || array[Math.floor(Math.random() * array.length)];
                }
            }
        }
        return array[Math.floor(Math.random() * array.length)];
    }

    async function generateNFT(tokenId, stageName = 'Lemon Seed') {
        const canvas = createCanvas(512, 512);
        const ctx = canvas.getContext('2d');

        const stageMap = {
            'Lemon Seed': 'seed',
            'Lemon Sprout': 'sprout',
            'Lemon Sapling': 'sapling',
            'Lemon Tree': 'tree'
        };
        const stageKey = stageMap[stageName] || 'seed';

        const backgroundPath = getRandomItem(nftLayers.backgrounds);
        let background;
        try {
            background = await loadImage(backgroundPath);
        } catch (error) {
            console.error(`Failed to load background image ${backgroundPath}: ${error.message}`);
            throw new Error(`Image load failed for background: ${backgroundPath}`);
        }
        ctx.drawImage(background, 0, 0, 512, 512);

        const rarityRules = {
            'diamond': 0.2,
            'red': 0.4,
            'purple': 0.5
        };
        const baseImagePath = getRandomItem(nftLayers[stageKey], rarityRules);
        let baseImage;
        try {
            baseImage = await loadImage(baseImagePath);
        } catch (error) {
            console.error(`Failed to load base image ${baseImagePath}: ${error.message}`);
            throw new Error(`Image load failed for base: ${baseImagePath}`);
        }
        ctx.drawImage(baseImage, 0, 0, 512, 512);

        const outputDir = path.join(__dirname, 'output');
        await fs.mkdir(outputDir, { recursive: true });
        const imagePath = path.join(outputDir, 'nft_' + tokenId + '.png');
        console.log(`[GenerateNFT] Saving image to: ${imagePath}`);
        const out = require('fs').createWriteStream(imagePath);
        const stream = canvas.createPNGStream();
        await new Promise((resolve, reject) => {
            stream.pipe(out);
            out.on('finish', () => {
                console.log(`[GenerateNFT] Image saved successfully: ${imagePath}`);
                resolve();
            });
            out.on('error', (err) => {
                console.error(`[GenerateNFT] Error saving image: ${err.message}`);
                reject(err);
            });
        });

        const rarity = baseImagePath.includes('diamond') ? 'Diamond' :
                      baseImagePath.includes('red') ? 'Ruby' :
                      baseImagePath.includes('purple') ? 'Amethyst' : 'Common';

        const metadata = {
            name: `${stageName} #${tokenId}`,
            symbol: stageKey === 'seed' ? 'LSEED' : stageKey === 'sprout' ? 'LSPRT' : stageKey === 'sapling' ? 'LSAPL' : 'LTREE',
            description: `A unique Lemon Club NFT at the ${stageName} stage with ${rarity} rarity!`,
            image: `/output/nft_${tokenId}.png`,
            attributes: [
                { trait_type: 'Stage', value: stageName.split(' ')[1] },
                { trait_type: 'Rarity', value: rarity },
                { trait_type: 'Background', value: path.basename(backgroundPath, '.png') },
                { trait_type: 'Base', value: path.basename(baseImagePath, '.png') }
            ],
            seller_fee_basis_points: 500,
            collection: { name: 'Lemon Club Collective', family: 'LCC' },
            properties: {
                files: [{ uri: `/output/nft_${tokenId}.png`, type: 'image/png' }],
                category: 'image',
                creators: [{ address: wallet.publicKey.toString(), share: 100 }]
            }
        };
        const metadataPath = path.join(outputDir, 'nft_' + tokenId + '.json');
        console.log(`[GenerateNFT] Saving metadata to: ${metadataPath}`);
        await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
        console.log(`[GenerateNFT] Metadata saved successfully: ${metadataPath}`);

        return { imagePath, metadataPath };
    }

    app.use(express.json());
    app.use(express.static('public'));
    app.use('/output', express.static(path.join(__dirname, 'output')));

    const stages = [
        { name: 'Lemon Seed', symbol: 'LSEED', uri: 'https://raw.githubusercontent.com/LemonClubCollective/NFT/refs/heads/main/seed.json', minPoints: 0 },
        { name: 'Lemon Sprout', symbol: 'LSPRT', uri: 'https://raw.githubusercontent.com/LemonClubCollective/NFT/refs/heads/main/sprout.json', minPoints: 30 },
        { name: 'Lemon Sapling', symbol: 'LSAPL', uri: 'https://raw.githubusercontent.com/LemonClubCollective/NFT/refs/heads/main/sapling.json', minPoints: 60 },
        { name: 'Lemon Tree', symbol: 'LTREE', uri: 'https://raw.githubusercontent.com/LemonClubCollective/NFT/refs/heads/main/tree.json', minPoints: 90 }
    ];

    function resetQuests(username, type) {
        if (!users[username] || !users[username].quests) return;
        const now = Date.now();
        const resetIntervals = { daily: 24 * 60 * 60 * 1000, weekly: 7 * 24 * 60 * 60 * 1000 };
        users[username].quests[type] = quests[type].map(q => {
            const existingQuest = users[username].quests[type].find(uq => uq.id === q.id) || {};
            const shouldReset = now >= (existingQuest.resetTimestamp || 0) + resetIntervals[type];
            return {
                id: q.id,
                name: q.name,
                desc: q.desc,
                goal: q.goal,
                reward: q.reward,
                progress: shouldReset ? 0 : (existingQuest.progress || 0),
                completed: shouldReset ? false : (existingQuest.progress >= q.goal),
                claimed: shouldReset ? false : (existingQuest.claimed || false),
                resetTimestamp: now
            };
        });
        saveData();
    }

    function updateQuestProgress(username, type, questId, increment) {
        if (!users[username] || !users[username].quests || !users[username].quests[type]) return;
        const quest = users[username].quests[type].find(q => q.id === questId);
        if (!quest || quest.completed) return;
        quest.progress = Math.min(quest.progress + increment, quest.goal);
        if (quest.progress >= quest.goal) quest.completed = true;
        saveData();
    }

    app.post('/register', (req, res) => {
        try {
            const { username, password } = req.body;
            if (!username || !password) {
                return res.status(400).json({ error: 'Username and password required' });
            }
            if (users[username]) {
                return res.status(400).json({ error: 'Username already taken' });
            }

            users[username] = { 
                password, 
                nfts: [], 
                lastLogin: 0, 
                points: 0,
                quests: {
                    daily: quests.daily.map(q => ({ id: q.id, name: q.name, desc: q.desc, goal: q.goal, reward: q.reward, progress: 0, completed: false, claimed: false, resetTimestamp: Date.now() })),
                    weekly: quests.weekly.map(q => ({ id: q.id, name: q.name, desc: q.desc, goal: q.goal, reward: q.reward, progress: 0, completed: false, claimed: false, resetTimestamp: Date.now() })),
                    limited: quests.limited.map(q => ({ id: q.id, name: q.name, desc: q.desc, goal: q.goal, reward: q.reward, progress: 0, completed: false, claimed: false }))
                }
            };
            saveData();
            console.log(`[Register] New user: ${username}`);
            res.json({ success: true, message: 'Registered successfully' });
        } catch (error) {
            console.error('[Register] Error:', error.message);
            res.status(500).json({ error: 'Failed to register' });
        }
    });

    app.post('/login', (req, res) => {
        try {
            const { username, password } = req.body;
            if (!username || !password) {
                return res.status(400).json({ error: 'Username and password required' });
            }

            const user = users[username];
            if (!user || user.password !== password) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            const now = Date.now();
            const oneDay = 24 * 60 * 60 * 1000;
            let pointsAwarded = false;
            if (now - user.lastLogin >= oneDay) {
                user.nfts.forEach(nft => nft.points += 1);
                user.lastLogin = now;
                pointsAwarded = true;
                resetQuests(username, 'daily');
                resetQuests(username, 'weekly');
                saveData();
                console.log(`[Login] Success for ${username}: Awarded points for ${user.nfts.length} NFTs`);
            } else {
                console.log(`[Login] Success for ${username}: No points, within 24-hour cooldown`);
            }

            res.json({ 
                success: true, 
                wallet: null,
                nfts: user.nfts.map(nft => ({ mintAddress: nft.mintAddress, points: nft.points })), 
                pointsAwarded 
            });
        } catch (error) {
            console.error('[Login] Error:', error.message);
            res.status(500).json({ error: 'Failed to login' });
        }
    });

    app.get('/nft/:username', async (req, res) => {
        try {
            const username = req.params.username;
            console.log(`[NFT] Fetching for user: ${username}`);
            const user = users[username] || { nfts: [] };

            if (!user.nfts.length) {
                return res.json({ success: true, error: 'No NFTs minted yet', nfts: [] });
            }

            const nftData = [];
            for (const nft of user.nfts) {
                const operation = async () => {
                    const mintAddress = new PublicKey(nft.mintAddress);
                    const nftInfo = await metaplex.nfts().findByMint({ mintAddress });
                    const currentStage = stages.find(s => s.name === nftInfo.name) || stages[0];
                    const currentStageIndex = stages.indexOf(currentStage);
                    const nextStage = stages[currentStageIndex + 1];

                    if (nft.staked && nft.stakeStart) {
                        const now = Date.now();
                        const secondsStaked = (now - nft.stakeStart) / 1000;
                        nft.rewards = Math.floor(secondsStaked / 60);
                    }

                    return {
                        nft: { name: nftInfo.name, symbol: nftInfo.symbol, mintAddress: nft.mintAddress },
                        points: nft.points,
                        nextMinPoints: nextStage ? nextStage.minPoints : null,
                        staked: nft.staked,
                        rewards: nft.rewards,
                        mintTimestamp: nft.mintTimestamp,
                        imageUri: nft.imageUri
                    };
                };
                const nftDataEntry = await retryRPC(operation);
                nftData.push(nftDataEntry);
            }

            console.log(`[NFT] Fetched for ${username}:`, JSON.stringify(nftData, null, 2));
            res.json({ success: true, nfts: nftData });
        } catch (error) {
            console.error('[NFT] Error:', error.message, error.stack);
            res.status(500).json({ success: false, error: 'Failed to fetch NFTs', details: error.message });
        }
    });

    app.post('/mint/:username', async (req, res) => {
        try {
            const username = req.params.username;
            const { wallet: walletAddress } = req.body;
            console.log(`[Mint] Attempt for ${username} with wallet ${walletAddress}`);
            const user = users[username];
            if (!user) {
                return res.status(400).json({ error: 'User not found—please login' });
            }

            const serverWallet = await loadWallet();
            const serverBalance = await connection.getBalance(serverWallet.publicKey);
            console.log(`[Mint] Server wallet balance: ${serverBalance / LAMPORTS_PER_SOL} SOL`);
            if (serverBalance < 0.03 * LAMPORTS_PER_SOL) {
                throw new Error('Server wallet has insufficient SOL. Please airdrop SOL to server wallet: 9kkHQYtLU142sFFHB7u7rB2C8MqQyhRKFiM85h81Ctgd');
            }

            const tokenId = Date.now();
            const { imagePath, metadataPath } = await generateNFT(tokenId, 'Lemon Seed');
            console.log(`[Mint] Generated files: ${imagePath}, ${metadataPath}`);

            const imageUri = `http://localhost:${port}/output/nft_${tokenId}.png`;
            const metadataContent = JSON.parse(await fs.readFile(metadataPath, 'utf8'));
            metadataContent.image = imageUri;
            await fs.writeFile(metadataPath, JSON.stringify(metadataContent, null, 2));
            const metadataUri = `file://${metadataPath}`;

            const mintKeypair = Keypair.generate();
            const tokenOwner = new PublicKey(walletAddress);

            console.log('[Mint] Creating NFT with server wallet as payer...');
            const createOperation = () => metaplex.nfts().create({
                uri: metadataUri,
                name: `Lemon Seed #${tokenId}`,
                symbol: 'LSEED',
                sellerFeeBasisPoints: 500,
                creators: [{ address: serverWallet.publicKey, share: 100 }],
                tokenOwner: tokenOwner,
                mint: mintKeypair,
                isMutable: true,
                payer: serverWallet,
                mintAuthority: serverWallet,
                updateAuthority: serverWallet
            }, { commitment: 'finalized' });
            const { nft, response } = await retryRPC(createOperation);

            if (!response.signature) {
                throw new Error('No transaction signature returned');
            }

            const actualMintAddress = nft.mint.address.toString();
            const mintTimestamp = Date.now();
            console.log(`[Mint] Success: Minted Lemon Seed #${tokenId}, Address: ${actualMintAddress}`);

            user.nfts.push({ 
                mintAddress: actualMintAddress, 
                points: 0, 
                staked: false, 
                stakeStart: 0, 
                rewards: 0,
                mintTimestamp,
                imageUri
            });
            updateQuestProgress(username, 'daily', 'lemon-picker', 1);
            saveData();

            res.json({
                success: true,
                mintAddress: actualMintAddress,
                transactionSignature: response.signature,
                imageUri,
                metadataUri,
                mintTimestamp
            });
        } catch (error) {
            console.error('[Mint] Error:', error.message, error.stack);
            res.status(500).json({ error: 'Failed to mint NFT', details: error.message });
        }
    });

    app.get('/evolve/:username/:mintAddress', async (req, res) => {
        try {
            const username = req.params.username;
            const mintAddressStr = req.params.mintAddress;
            const user = users[username];
            if (!user) {
                return res.status(400).json({ error: 'User not found—please login' });
            }

            const nftRecord = user.nfts.find(nft => nft.mintAddress === mintAddressStr);
            if (!nftRecord) {
                return res.status(400).json({ error: 'NFT not found' });
            }

            const mintAddress = new PublicKey(nftRecord.mintAddress);
            const nft = await metaplex.nfts().findByMint({ mintAddress });
            const currentStage = stages.find(s => s.name === nft.name) || stages[0];
            const currentStageIndex = stages.indexOf(currentStage);
            const nextStage = stages[currentStageIndex + 1];

            if (!nextStage) {
                return res.status(400).json({ error: 'No next stage available' });
            }

            if (nftRecord.points < nextStage.minPoints && nftRecord.rewards < 5) {
                return res.status(400).json({ error: 'Not enough points or rewards (need 30+ points or 5+ rewards)' });
            }

            let usedRewards = false;
            if (nftRecord.rewards >= 5) {
                nftRecord.rewards -= 5;
                usedRewards = true;
            } else {
                nftRecord.points -= nextStage.minPoints;
            }

            const tokenId = Date.now();
            const { imagePath, metadataPath } = await generateNFT(tokenId, nextStage.name);
            const imageUri = `http://localhost:${port}/output/nft_${tokenId}.png`;
            const metadataContent = JSON.parse(await fs.readFile(metadataPath, 'utf8'));
            metadataContent.image = imageUri;
            await fs.writeFile(metadataPath, JSON.stringify(metadataContent, null, 2));
            const metadataUri = `file://${metadataPath}`;

            const { response } = await metaplex.nfts().update({
                nftOrSft: nft,
                name: nextStage.name,
                symbol: nextStage.symbol,
                uri: metadataUri,
                sellerFeeBasisPoints: 500,
                authority: wallet
            }, { commitment: 'finalized' });

            nftRecord.imageUri = imageUri;
            updateQuestProgress(username, 'limited', 'million-lemon-bash', 1);
            saveData();
            res.json({
                success: true,
                newStage: { name: nextStage.name, symbol: nextStage.symbol },
                transactionSignature: response.signature,
                usedRewards,
                imageUri
            });
        } catch (error) {
            console.error('[Evolve] Error:', error.message, error.stack);
            res.status(500).json({ error: 'Failed to evolve NFT', details: error.message });
        }
    });

    app.post('/stake/:username/:mintAddress', async (req, res) => {
        try {
            const username = req.params.username;
            const mintAddressStr = req.params.mintAddress;
            const user = users[username];
            if (!user) {
                return res.status(400).json({ error: 'User not found—please login' });
            }

            const nftRecord = user.nfts.find(nft => nft.mintAddress === mintAddressStr);
            if (!nftRecord) {
                return res.json({ error: 'NFT not found' });
            }

            if (nftRecord.staked) {
                return res.json({ error: 'NFT already staked' });
            }

            nftRecord.staked = true;
            nftRecord.stakeStart = Date.now();
            updateQuestProgress(username, 'weekly', 'grove-keeper', 1);
            saveData();
            res.json({ success: true, message: 'NFT staked' });
        } catch (error) {
            console.error('[Stake] Error:', error.message);
            res.status(500).json({ error: 'Failed to stake NFT' });
        }
    });

    app.post('/unstake/:username/:mintAddress', async (req, res) => {
        try {
            const username = req.params.username;
            const mintAddressStr = req.params.mintAddress;
            const user = users[username];
            if (!user) {
                return res.status(400).json({ error: 'User not found—please login' });
            }

            const nftRecord = user.nfts.find(nft => nft.mintAddress === mintAddressStr);
            if (!nftRecord) {
                return res.json({ error: 'NFT not found' });
            }

            if (!nftRecord.staked) {
                return res.json({ error: 'NFT not staked' });
            }

            const now = Date.now();
            const secondsStaked = (now - nftRecord.stakeStart) / 1000;
            nftRecord.rewards += Math.floor(secondsStaked / 60);
            nftRecord.staked = false;
            nftRecord.stakeStart = 0;
            saveData();
            res.json({ success: true, message: 'NFT unstaked', rewards: nftRecord.rewards });
        } catch (error) {
            console.error('[Unstake] Error:', error.message);
            res.status(500).json({ error: 'Failed to unstake NFT' });
        }
    });

    app.get('/posts', (req, res) => {
        res.json(posts);
    });

    app.post('/posts', (req, res) => {
        try {
            const { wallet, content } = req.body;
            if (!wallet || !content || content.length > 280) {
                return res.status(400).json({ error: 'Invalid post: Wallet required, max 280 characters' });
            }

            const post = {
                wallet,
                content,
                timestamp: Date.now(),
                likes: 0,
                comments: []
            };
            posts.unshift(post);
            const username = Object.keys(users).find(u => users[u].nfts.some(n => n.mintAddress === wallet));
            if (username) {
                updateQuestProgress(username, 'daily', 'community-zest', 1);
                updateQuestProgress(username, 'weekly', 'lemon-bard', 1);
            }
            saveData();
            res.json({ success: true, post });
        } catch (error) {
            console.error('[Posts] Error:', error.message);
            res.status(500).json({ error: 'Failed to create post' });
        }
    });

    app.post('/posts/like', (req, res) => {
        try {
            const { wallet, postIndex } = req.body;
            if (!wallet || postIndex === undefined || postIndex < 0 || postIndex >= posts.length) {
                return res.status(400).json({ error: 'Invalid like request' });
            }

            posts[postIndex].likes += 1;
            saveData();
            res.json({ success: true, likes: posts[postIndex].likes });
        } catch (error) {
            console.error('[Posts] Error liking:', error.message);
            res.status(500).json({ error: 'Failed to like post' });
        }
    });

    app.post('/posts/comment', (req, res) => {
        try {
            const { wallet, postIndex, content } = req.body;
            if (!wallet || postIndex === undefined || postIndex < 0 || postIndex >= posts.length || !content || content.length > 280) {
                return res.status(400).json({ error: 'Invalid comment: Wallet, post index, and content (max 280 chars) required' });
            }

            const comment = {
                wallet,
                content,
                timestamp: Date.now(),
                likes: 0,
                replies: []
            };
            posts[postIndex].comments = posts[postIndex].comments || [];
            posts[postIndex].comments.push(comment);
            const username = Object.keys(users).find(u => users[u].nfts.some(n => n.mintAddress === wallet));
            if (username) updateQuestProgress(username, 'weekly', 'lemon-bard', 1);
            saveData();
            res.json({ success: true, comment });
        } catch (error) {
            console.error('[Comments] Error:', error.message);
            res.status(500).json({ error: 'Failed to add comment' });
        }
    });

    app.post('/posts/comment/reply', (req, res) => {
        try {
            const { wallet, postIndex, path, content } = req.body;
            if (!wallet || postIndex === undefined || postIndex < 0 || postIndex >= posts.length || 
                !path || !Array.isArray(path) || !content || content.length > 280) {
                return res.status(400).json({ error: 'Invalid reply: Wallet, post index, path, and content (max 280 chars) required' });
            }

            let currentLevel = posts[postIndex].comments;
            for (let i = 0; i < path.length; i++) {
                const index = path[i];
                if (!currentLevel[index]) {
                    return res.status(400).json({ error: 'Invalid reply path' });
                }
                currentLevel[index].replies = currentLevel[index].replies || [];
                if (i < path.length - 1) {
                    currentLevel = currentLevel[index].replies;
                }
            }

            const reply = {
                wallet,
                content,
                timestamp: Date.now(),
                likes: 0,
                replies: []
            };
            currentLevel[path[path.length - 1]].replies.push(reply);
            const username = Object.keys(users).find(u => users[u].nfts.some(n => n.mintAddress === wallet));
            if (username) updateQuestProgress(username, 'weekly', 'lemon-bard', 1);
            saveData();
            res.json({ success: true, reply });
        } catch (error) {
            console.error('[Replies] Error:', error.message);
            res.status(500).json({ error: 'Failed to add reply' });
        }
    });

    app.post('/posts/comment/like', (req, res) => {
        try {
            const { wallet, postIndex, path } = req.body;
            if (!wallet || postIndex === undefined || postIndex < 0 || postIndex >= posts.length || 
                !path || !Array.isArray(path)) {
                return res.status(400).json({ error: 'Invalid comment like request' });
            }

            let currentLevel = posts[postIndex].comments;
            for (let i = 0; i < path.length; i++) {
                const index = path[i];
                if (!currentLevel[index]) {
                    return res.status(400).json({ error: 'Invalid like path' });
                }
                if (i === path.length - 1) {
                    currentLevel[index].likes += 1;
                } else {
                    currentLevel = currentLevel[index].replies;
                }
            }

            saveData();
            res.json({ success: true, likes: currentLevel[path[path.length - 1]].likes });
        } catch (error) {
            console.error('[Comments] Error liking:', error.message);
            res.status(500).json({ error: 'Failed to like comment' });
        }
    });

    app.get('/quests/:username', (req, res) => {
        try {
            const { username } = req.params;
            if (!users[username]) return res.status(404).json({ success: false, error: 'User not found' });
            if (!users[username].quests) {
                users[username].quests = {
                    daily: quests.daily.map(q => ({ id: q.id, name: q.name, desc: q.desc, goal: q.goal, reward: q.reward, progress: 0, completed: false, claimed: false, resetTimestamp: Date.now() })),
                    weekly: quests.weekly.map(q => ({ id: q.id, name: q.name, desc: q.desc, goal: q.goal, reward: q.reward, progress: 0, completed: false, claimed: false, resetTimestamp: Date.now() })),
                    limited: quests.limited.map(q => ({ id: q.id, name: q.name, desc: q.desc, goal: q.goal, reward: q.reward, progress: 0, completed: false, claimed: false }))
                };
                saveData();
            }
            resetQuests(username, 'daily');
            resetQuests(username, 'weekly');
            const responseData = {
                success: true,
                daily: users[username].quests.daily,
                weekly: users[username].quests.weekly,
                limited: users[username].quests.limited,
                points: users[username].points
            };
            console.log(`[Quests] Fetching for ${username}:`, JSON.stringify(responseData, null, 2));
            res.json(responseData);
        } catch (error) {
            console.error('[Quests] Error fetching:', error.message);
            res.status(500).json({ error: 'Failed to fetch quests' });
        }
    });

    app.post('/quests/:username/update', (req, res) => {
        try {
            const { username } = req.params;
            const { questId, type, progress } = req.body;
            if (!users[username]) return res.status(404).json({ success: false, error: 'User not found' });
            if (!users[username].quests) {
                users[username].quests = {
                    daily: quests.daily.map(q => ({ id: q.id, name: q.name, desc: q.desc, goal: q.goal, reward: q.reward, progress: 0, completed: false, claimed: false, resetTimestamp: Date.now() })),
                    weekly: quests.weekly.map(q => ({ id: q.id, name: q.name, desc: q.desc, goal: q.goal, reward: q.reward, progress: 0, completed: false, claimed: false, resetTimestamp: Date.now() })),
                    limited: quests.limited.map(q => ({ id: q.id, name: q.name, desc: q.desc, goal: q.goal, reward: q.reward, progress: 0, completed: false, claimed: false }))
                };
            }
            const quest = users[username].quests[type].find(q => q.id === questId);
            if (!quest) return res.status(400).json({ success: false, error: 'Quest not found' });
            quest.progress = Math.min(progress, quest.goal);
            if (quest.progress >= quest.goal) quest.completed = true;
            saveData();
            res.json({ success: true });
        } catch (error) {
            console.error('[Quests] Error updating:', error.message);
            res.status(500).json({ error: 'Failed to update quest' });
        }
    });

    app.post('/quests/:username/claim', (req, res) => {
        try {
            const { username } = req.params;
            const { questId } = req.body;
            console.log(`[Quests] Attempting to claim ${questId} for ${username}`);
            if (!users[username]) return res.status(404).json({ success: false, error: 'User not found' });
            if (!users[username].quests) {
                users[username].quests = {
                    daily: quests.daily.map(q => ({ id: q.id, name: q.name, desc: q.desc, goal: q.goal, reward: q.reward, progress: 0, completed: false, claimed: false, resetTimestamp: Date.now() })),
                    weekly: quests.weekly.map(q => ({ id: q.id, name: q.name, desc: q.desc, goal: q.goal, reward: q.reward, progress: 0, completed: false, claimed: false, resetTimestamp: Date.now() })),
                    limited: quests.limited.map(q => ({ id: q.id, name: q.name, desc: q.desc, goal: q.goal, reward: q.reward, progress: 0, completed: false, claimed: false }))
                };
            }
            const allQuests = [
                ...users[username].quests.daily,
                ...users[username].quests.weekly,
                ...users[username].quests.limited
            ];
            const quest = allQuests.find(q => q.id === questId);
            if (!quest) {
                console.log(`[Quests] Quest ${questId} not found for ${username}`);
                return res.status(400).json({ success: false, error: 'Quest not found' });
            }
            console.log(`[Quests] Quest ${questId} progress: ${quest.progress}/${quest.goal}, completed: ${quest.completed}, claimed: ${quest.claimed}`);
            if (!quest.completed || quest.claimed) {
                return res.status(400).json({ success: false, error: 'Quest not completed or already claimed' });
            }
            quest.claimed = true;
            users[username].points += quest.reward;
            saveData();
            console.log(`[Quests] Claimed ${questId} for ${username}: ${quest.reward} points`);
            res.json({ success: true, points: quest.reward });
        } catch (error) {
            console.error('[Quests] Error claiming:', error.message);
            res.status(500).json({ error: 'Failed to claim reward' });
        }
    });

    app.listen(port, () => console.log(`Server running on http://localhost:${port}`));
}

initialize().catch(err => console.error('Initialization failed:', err));