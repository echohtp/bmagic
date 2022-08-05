import { useState, useEffect } from 'react'
import './index.css'
import { Magic } from 'magic-sdk'
import { SolanaExtension } from '@magic-ext/solana'
import * as web3 from '@solana/web3.js'
import { PublicKey } from '@solana/web3.js'
import { add } from 'ramda'
import { ApolloClient, InMemoryCache, gql } from '@apollo/client'
import { Navigation, Pagination, Scrollbar, A11y } from 'swiper'
import { Swiper, SwiperSlide } from 'swiper/react'

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/scrollbar';

const rpcUrl = process.env.REACT_APP_RPC_URL || ''

const client = new ApolloClient({
  uri: 'https://graph.holaplex.com/v1',
  cache: new InMemoryCache()
})

const magic = new Magic(process.env.REACT_APP_MAGIC_PUBLISHABLE_KEY || '', {
  extensions: {
    solana: new SolanaExtension({
      rpcUrl
    })
  }
})

const addressAvatar = (publicKey: PublicKey) => {
  const gradient = publicKey.toBytes().reduce(add, 0) % 8
  return `https://holaplex.com/images/gradients/gradient-${gradient + 1}.png`
}

interface UserMetadata {
  publicAddress: string | null
  email: string | null
}

interface Nft {
  address: string
  description: string
  image: string
  mintAddress: string
  name: string
}

const initMetdata: UserMetadata = {
  publicAddress: '',
  email: ''
}


// const handleSendTransaction = async () => {
//   setSendingTransaction(true);
//   const recipientPubKey = new web3.PublicKey(destinationAddress);
//   const payer = new web3.PublicKey(userMetadata.publicAddress);

//   const hash = await connection.getRecentBlockhash();

//   let transactionMagic = new web3.Transaction({
//     feePayer: payer,
//     recentBlockhash: hash.blockhash
//   });

//   const transaction = web3.SystemProgram.transfer({
//     fromPubkey: payer,
//     toPubkey: recipientPubKey,
//     lamports: sendAmount
//   });

//   transactionMagic.add(...[transaction]);

//   const serializeConfig = {
//     requireAllSignatures: false,
//     verifySignatures: true
//   };

//   const signedTransaction = await magic.solana.signTransaction(
//     transactionMagic,
//     serializeConfig
//   );

//   console.log("Signed transaction", signedTransaction);

//   const tx = web3.Transaction.from(signedTransaction.rawTransaction);
//   const signature = await connection.sendRawTransaction(tx.serialize());
//   setTxHash(`https://explorer.solana.com/tx/${signature}?cluster=devnet`);
//   setSendingTransaction(false);
// };

export default function App () {
  const [email, setEmail] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userMetadata, setUserMetadata] = useState<UserMetadata>(initMetdata)
  const [balance, setBalance] = useState(0)
  const [nfts, setNfts] = useState<Nft[]>([])
  const connection = new web3.Connection(rpcUrl)

  const login = async () => {
    await magic.auth.loginWithMagicLink({ email })
    setIsLoggedIn(true)
  }

  const logout = async () => {
    await magic.user.logout()
    setIsLoggedIn(false)
  }

  const getBalance = async (pubKey: any) => {
    connection
      .getBalance(pubKey)
      .then(bal => setBalance(bal / web3.LAMPORTS_PER_SOL))
  }

  useEffect(() => {
    magic.user.isLoggedIn().then(async magicIsLoggedIn => {
      if (magicIsLoggedIn) {
        magic.user
          .getMetadata()
          .then(user => {
            setUserMetadata(user)
            //@ts-ignore
            const pubKey = new web3.PublicKey(user.publicAddress)
            getBalance(pubKey)
          })
          .then(() => {
            setIsLoggedIn(magicIsLoggedIn)
          })
      } else {
        setIsLoggedIn(magicIsLoggedIn)
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn])

  useEffect(() => {
    const GET_NFTS = gql`
      query GetNfts($owners: [PublicKey!], $limit: Int!, $offset: Int!) {
        nfts(owners: $owners, limit: $limit, offset: $offset) {
          address
          mintAddress
          name
          description
          image
          owner {
            address
            associatedTokenAccountAddress
          }
        }
      }
    `
    client
      .query({
        query: GET_NFTS,
        variables: {
          owners: [userMetadata.publicAddress],
          limit: 100,
          offset: 0
        }
      })
      .then(result => {
        console.log(result.data.nfts)
        setNfts(result.data.nfts)
      })
  }, [userMetadata])

  
  // const mintIt = async () => {
  //   if (!userMetadata.publicAddress){
  //     return
  //   }
  //   setMintLoading(true)
  //   console.log("mint it")

  //   const payer = new web3.PublicKey(userMetadata.publicAddress);

  //   let transactionMagic = new web3.Transaction();
  //   transactionMagic.feePayer = payer
  //   transactionMagic.recentBlockhash = (await connection.getLatestBlockhash()).blockhash


  //   // TO DO 
  //   const mintNftInstructionAccounts = {
  //     candyMachine: new web3.PublicKey(""),
  //     candyMachineCreator: new web3.PublicKey(""),
  //     payer: payer,
  //     wallet: payer,
  //     metadata: new web3.PublicKey(""),
  //     mint: new web3.PublicKey(""),
  //     mintAuthority:new web3.PublicKey(""),
  //     updateAuthority: new web3.PublicKey(""),
  //     masterEdition: new web3.PublicKey(""),
  //     tokenMetadataProgram: new web3.PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"), // where is this exported from?
  //     clock: new web3.PublicKey(""),
  //     recentBlockhashes: new web3.PublicKey(""),
  //     instructionSysvarAccount: new web3.PublicKey("")
  //   }

  //   const mintNftInstructionArgs ={
  //     creatorBump: 0
  //   }

  //   const transaction = createMintNftInstruction(
  //     mintNftInstructionAccounts,
  //     mintNftInstructionArgs
  //   )

  //   transactionMagic.add(transaction);

  //   const serializeConfig = {
  //     requireAllSignatures: false,
  //     verifySignatures: true
  //   };

  //   const signedTransaction = await magic.solana.signTransaction(
  //     transactionMagic,
  //     serializeConfig
  //   );

  //   console.log("Signed transaction", signedTransaction);

  //   const tx = web3.Transaction.from(signedTransaction.rawTransaction);
  //   const signature = await connection.sendRawTransaction(tx.serialize());

  //   console.log(signature)

  //   setMintLoading(false)
  // }

  return (
    <div className='App'>
      {!isLoggedIn ? (
        <div className='container text-center'>
          <h1>Please sign up or login</h1>
          <input
            type='email'
            name='email'
            required={true}
            placeholder='Enter your email'
            onChange={event => {
              setEmail(event.target.value)
            }}
          />
          <button onClick={login}>Send</button>
        </div>
      ) : userMetadata.publicAddress === '' ? (
        <>
          <div>Loading User Data...</div>
        </>
      ) : (
        <div>
          <div className='navbar bg-base-100'>
            <div className='flex-1'>
              <button className='btn btn-ghost normal-case text-xl'>
                Magical 👋✨
              </button>
            </div>
            <div className='flex-none'>
              <div className='dropdown dropdown-end'>
                <label tabIndex={0} className='btn btn-ghost btn-circle avatar'>
                  <div className='w-10 rounded-full'>
                    <img
                      alt='profile'
                      src={
                        userMetadata.publicAddress
                          ? addressAvatar(
                              new PublicKey(userMetadata.publicAddress)
                            )
                          : 'https://placeimg.com/80/80/people'
                      }
                    />
                  </div>
                </label>
                <ul
                  tabIndex={0}
                  className='menu menu-compact dropdown-content mt-3 p-2 shadow bg-base-100 rounded-box w-52'
                >
                  <li>
                    <button>{userMetadata.email}</button>
                  </li>
                  <li>
                    <button>
                      {userMetadata.publicAddress?.slice(0, 4) +
                        '...' +
                        userMetadata.publicAddress?.slice(-4)}
                    </button>
                  </li>
                  <li>
                    <button className='' onClick={() => {}}>
                      {balance} SOL
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => {
                        magic.user.showSettings()
                      }}
                    >
                      Settings
                    </button>
                  </li>
                  <li>
                    <button onClick={() => logout()}>Logout</button>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div className='container text-center py-4'>
            <h1>Current user: {userMetadata.email}</h1>
          </div>
          <div className='container text-center py-4'>
            <h1>Solana address</h1>
            <div className='info'>{userMetadata.publicAddress}</div>
          </div>

          {/* <div className='container'>
            <h2>Mint Something</h2>
            <Button className='btn btn-primary btn-xl' onClick={()=>{
              mintIt()
            }} loading={mintLoading}>Mint me</Button>
          </div> */}

          <div className='container'>
            <h2>Your NFTs</h2>
            <Swiper
              // install Swiper modules
              modules={[Navigation, Pagination, Scrollbar, A11y]}
              spaceBetween={50}
              slidesPerView={3}
              navigation
              pagination={{ clickable: true }}
              scrollbar={{ draggable: true }}
              onSwiper={swiper => console.log(swiper)}
              onSlideChange={() => console.log('slide change')}
            >
              {nfts.map(e => (
                <SwiperSlide>
                  <img alt="nft art" src={e.image} />
                  <p>{e.description}</p>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </div>
      )}
    </div>
  )
}
