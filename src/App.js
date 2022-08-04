import React, { useState, useEffect } from "react";
import "./index.css";
import { Magic } from "magic-sdk";
import { SolanaExtension } from "@magic-ext/solana";
import * as web3 from "@solana/web3.js";

const rpcUrl = process.env.REACT_APP_RPC_URL;

const magic = new Magic(process.env.REACT_APP_MAGIC_PUBLISHABLE_KEY, {
  extensions: {
    solana: new SolanaExtension({
      rpcUrl
    })
  }
});

export default function App() {
  const [email, setEmail] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userMetadata, setUserMetadata] = useState({});
  const [balance, setBalance] = useState(0);
  const [destinationAddress, setDestinationAddress] = useState("");
  const [sendAmount, setSendAmount] = useState(0);
  const [txHash, setTxHash] = useState("");
  const [sendingTransaction, setSendingTransaction] = useState(false);
  const [disabled, setDisabled] = useState(false);

  const connection = new web3.Connection(rpcUrl);

  const login = async () => {
    await magic.auth.loginWithMagicLink({ email });
    setIsLoggedIn(true);
  };

  const logout = async () => {
    await magic.user.logout();
    setIsLoggedIn(false);
  };

  const getBalance = async (pubKey) => {
    connection.getBalance(pubKey).then((bal) => setBalance(bal / web3.LAMPORTS_PER_SOL ));
  };

  const requestSol = async () => {
    setDisabled(true);
    const pubKey = new web3.PublicKey(userMetadata.publicAddress);
    const airdropSignature = await connection.requestAirdrop(
      pubKey,
      web3.LAMPORTS_PER_SOL
    );

    await connection.confirmTransaction(airdropSignature);
    getBalance(pubKey);
    setDisabled(false);
  };

  const handleSendTransaction = async () => {
    setSendingTransaction(true);
    const recipientPubKey = new web3.PublicKey(destinationAddress);
    const payer = new web3.PublicKey(userMetadata.publicAddress);

    const hash = await connection.getRecentBlockhash();

    let transactionMagic = new web3.Transaction({
      feePayer: payer,
      recentBlockhash: hash.blockhash
    });

    const transaction = web3.SystemProgram.transfer({
      fromPubkey: payer,
      toPubkey: recipientPubKey,
      lamports: sendAmount
    });

    transactionMagic.add(...[transaction]);

    const serializeConfig = {
      requireAllSignatures: false,
      verifySignatures: true
    };

    const signedTransaction = await magic.solana.signTransaction(
      transactionMagic,
      serializeConfig
    );

    console.log("Signed transaction", signedTransaction);

    const tx = web3.Transaction.from(signedTransaction.rawTransaction);
    const signature = await connection.sendRawTransaction(tx.serialize());
    setTxHash(`https://explorer.solana.com/tx/${signature}?cluster=devnet`);
    setSendingTransaction(false);
  };

  useEffect(() => {
    magic.user.isLoggedIn().then(async (magicIsLoggedIn) => {
      setIsLoggedIn(magicIsLoggedIn);
      if (magicIsLoggedIn) {
        magic.user.getMetadata().then((user) => {
          setUserMetadata(user);
          const pubKey = new web3.PublicKey(user.publicAddress);
          getBalance(pubKey);
        });
      }
    });
  }, [isLoggedIn, getBalance]);

  console.log(userMetadata)
  return (
    <div className="App">
      {!isLoggedIn ? (
        <div className="container">
          <h1>Please sign up or login</h1>
          <input
            type="email"
            name="email"
            required="required"
            placeholder="Enter your email"
            onChange={(event) => {
              setEmail(event.target.value);
            }}
          />
          <button onClick={login}>Send</button>
        </div>
      ) : (
        <div>
          <div class="navbar bg-base-100">
            <div class="flex-1">
              <a class="btn btn-ghost normal-case text-xl">Banana Magic</a>
            </div>
            <div class="flex-none">
              <div class="dropdown dropdown-end">
                <label tabindex="0" class="btn btn-ghost btn-circle avatar">
                  <div class="w-10 rounded-full">
                    <img src="https://placeimg.com/80/80/people" />
                  </div>
                </label>
                <ul tabindex="0" class="menu menu-compact dropdown-content mt-3 p-2 shadow bg-base-100 rounded-box w-52">
                  <li><a>
                    {userMetadata.email}
                    </a>
                  </li>
                  <li><a>
                    {userMetadata.publicAddress?.slice(0,4) + "..." + userMetadata.publicAddress?.slice(-4)}
                    </a>
                  </li>
                  <li><a onClick={()=>{}}>{balance} SOL</a></li>
                  <li><a onClick={()=>{magic.user.showSettings()}}>Settings</a></li>
                  <li><a onClick={()=>logout()}>Logout</a></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="container text-center py-4">
            <h1>Current user: {userMetadata.email}</h1>
          </div>
          <div className="container text-center py-4" >
            <h1>Solana address</h1>
            <div className="info">{userMetadata.publicAddress}</div>
          </div>
        </div>
      )}
    </div>
  );
}
