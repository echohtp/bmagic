import React, { useState, useEffect } from "react";
import "./index.css";
import { Magic } from "magic-sdk";
import { SolanaExtension } from "@magic-ext/solana";
import * as web3 from "@solana/web3.js";
import { PublicKey } from "@solana/web3.js"; 
import { add } from 'ramda'

const rpcUrl = process.env.REACT_APP_RPC_URL || "";

const magic = new Magic(process.env.REACT_APP_MAGIC_PUBLISHABLE_KEY || "", {
  extensions: {
    solana: new SolanaExtension({
      rpcUrl
    })
  }
});

const addressAvatar = (publicKey: PublicKey) => {
  const gradient = publicKey.toBytes().reduce(add, 0) % 8
  return `https://holaplex.com/images/gradients/gradient-${gradient + 1}.png`
}

interface UserMetadata { 
  publicAddress: string | null
  email: string | null
}

const initMetdata: UserMetadata = {
  publicAddress: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  email: "USDCOIN@solana.com"
}

export default function App() {
  const [email, setEmail] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userMetadata, setUserMetadata] = useState<UserMetadata>(initMetdata);
  const [balance, setBalance] = useState(0);


  const connection = new web3.Connection(rpcUrl);

  const login = async () => {
    await magic.auth.loginWithMagicLink({ email });
    setIsLoggedIn(true);
  };

  const logout = async () => {
    await magic.user.logout();
    setIsLoggedIn(false);
  };

  const getBalance = async (pubKey: any)  => {
    connection.getBalance(pubKey).then((bal) => setBalance(bal / web3.LAMPORTS_PER_SOL ));
  };


  useEffect(() => {
    magic.user.isLoggedIn().then(async (magicIsLoggedIn) => {
      if (magicIsLoggedIn) {
        magic.user.getMetadata().then((user) => {
          setIsLoggedIn(magicIsLoggedIn);
          setUserMetadata(user);
          //@ts-ignore
          const pubKey = new web3.PublicKey(user.publicAddress);
          getBalance(pubKey);
        });
      }else{
        setIsLoggedIn(magicIsLoggedIn);
      }
    });
       // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn]);

  console.log(userMetadata)
  return (
    <div className="App">
      {!isLoggedIn ? (
        <div className="container">
          <h1>Please sign up or login</h1>
          <input
            type="email"
            name="email"
            required={true}
            placeholder="Enter your email"
            onChange={(event) => {
              setEmail(event.target.value);
            }}
          />
          <button onClick={login}>Send</button>
        </div>
      ) : (
        <div>
          <div className="navbar bg-base-100">
            <div className="flex-1">
              <a className="btn btn-ghost normal-case text-xl">Banana Magic</a>
            </div>
            <div className="flex-none">
              <div className="dropdown dropdown-end">
                <label tab-index="0" className="btn btn-ghost btn-circle avatar">
                  <div className="w-10 rounded-full">
                    <img src={ userMetadata.publicAddress ? addressAvatar(new PublicKey(userMetadata.publicAddress)) : ""} />
                  </div>
                </label>
                <ul tab-index="0" className="menu menu-compact dropdown-content mt-3 p-2 shadow bg-base-100 rounded-box w-52">
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
