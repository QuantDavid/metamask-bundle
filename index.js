import { ethers } from "ethers";
import MetaMaskOnboarding from "@metamask/onboarding";
import {
    erc20ABI,
    erc20Bytecode,
    collectiblesABI,
    collectiblesBytecode,
} from "./constants.json";

export class MetaMask {

    constructor() {
        try {
            const currentUrl = new URL(window.location.href);
            const forwarderOrigin =
                currentUrl.hostname === 'localhost' ? 'http://localhost:9010' : undefined;

            this.ethersProvider = new ethers.providers.Web3Provider(window.ethereum, 'any');
            this.onboarding = new MetaMaskOnboarding({ forwarderOrigin });
            this.accounts = [];

        } catch (error) {
            console.error(error.message);
        }
    }

    isMetaMaskConnected() {
        return this.accounts && this.accounts.length > 0
    }

    installPlugin() {
        this.onboarding.startOnboarding();
    }

    async connectToWallet() {
        try {
            const newAccounts = await ethereum.request({
                method: 'eth_requestAccounts',
            });
            this.accounts = newAccounts;
            return newAccounts
        } catch (error) {
            console.error(error);
        }
    }

    async addEthereumChain() {
        try {
            await ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [
                    {
                        chainId: '0x3356',
                        rpcUrls: ['https://besu-metamask-test-09fd44ff0b-node-9dfbbf21.baas.twcc.ai'],
                        chainName: 'TWCC-Besu',
                        // nativeCurrency: { name: '', decimals: 18, symbol: '' },
                        // blockExplorerUrls: [''],
                    },
                ],
            });

            return true
        } catch (error) {
            // console.error(error.message)
            return false
        }
        
    };

    async switchEthereumChain() {
        try {
            await ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [
                    {
                        chainId: '0x3356',
                    },
                ],
            });
            return true
        } catch (error) {
            console.error(error.message)
            return false
        }
        
    };

    async connectToCollectiblesContract(address) {
        let contract;
        try {
            contract = new ethers.Contract(
                address, 
                collectiblesABI, 
                this.ethersProvider.getSigner()
            )

            return contract
        } catch (error) {
            console.error(error.message)
            return null
        }
    }

    async connectToERC20Contract(address) {
        let contract;
        try {
            contract = new ethers.Contract(
                address, 
                erc20ABI, 
                this.ethersProvider.getSigner()
            )

            return contract
        } catch (error) {
            console.error(error.message)
            return null
        }
    }

    async deployCollectibles() {
        let contract;
        let collectiblesFactory = new ethers.ContractFactory(
            collectiblesABI,
            collectiblesBytecode,
            this.ethersProvider.getSigner(),
        );
        try {
            contract = await collectiblesFactory.deploy();
            await contract.deployTransaction.wait();
        } catch (error) {
            console.error('Deployment Failed');
            throw error;
        }

        if (contract.address === undefined) {
            return;
        }

        console.log(
            `Contract mined! address: ${contract.address} transactionHash: ${contract.transactionHash}`,
        );
        return contract
    }

    async mint(contract, value) {
        console.log('Mint initiated');
        let result = await contract.mintCollectibles(value, {
            from: this.accounts[0],
        });
        result = await result.wait();
        // console.log(result);
        console.log('Mint completed');
        return result
    }

    async sendEth(to, value) {
        const result = await ethereum.request({
            method: 'eth_sendTransaction',
            params: [
                {
                    from: this.accounts[0],
                    to: to,
                    value: value,
                    gasLimit: '0x5028',
                    gasPrice: '0x2540be400',
                    type: '0x0',
                },
            ],
        });
        console.log(result);
        return result
    }

    async deployERC20(tokenName, tokenSymbol, initialAmount) {
        const _initialAmount = initialAmount;
        const _tokenName = tokenName;
        const _decimalUnits = 18;
        const _tokenSymbol = tokenSymbol;

        let erc20Factory = new ethers.ContractFactory(
            erc20ABI,
            erc20Bytecode,
            this.ethersProvider.getSigner(),
        );

        try {
            const contract = await erc20Factory.deploy(
                _initialAmount,
                _tokenName,
                _decimalUnits,
                _tokenSymbol,
            );
            await contract.deployTransaction.wait();

            if (contract.address === undefined) {
              return undefined;
            }

            console.log(
              `Contract mined! address: ${contract.address} transactionHash: ${contract.transactionHash}`,
            );

            return contract;

        } catch (error) {
            console.error('Creation Failed');
            throw error;
        }
    }

    async addTokenToWallet(contract, tokenSymbol) {
        const result = await ethereum.request({
            method: 'wallet_watchAsset',
            params: {
                type: 'ERC20',
                options: {
                    address: contract.address,
                    symbol: tokenSymbol,
                    decimals: 4,
                    image: 'https://metamask.github.io/test-dapp/metamask-fox.svg',
                },
            },
        });
        console.log(result);
        return result
    }

    async transferTokens(contract, to, value) {
        const result = await contract.transfer(
            to,
            value,
            {
                from: this.accounts[0],
                gasLimit: 60000,
                gasPrice: '20000000000',
            },
        );
        console.log(result);
        return result
    }

    async approveTokens(contract, to, value) {
        const result = await contract.approve(
            to,
            value,
            {
                from: this.accounts[0],
                gasLimit: 60000,
                gasPrice: '20000000000',
            },
        );
        console.log(result);
        return result
    }

    async transferTokensWithoutGas(contract, to, value) {
        const result = await contract.transfer(
            to,
            value,
            {
                gasPrice: '20000000000',
            },
        );
        console.log(result);
        return result
    }

    async approveTokensWithoutGas(contract, to, value) {
        const result = await contract.approve(
            to,
            value,
            {
                gasPrice: '20000000000',
            },
        );
        console.log(result);
        return result
    }

    async getAccount() {
        try {
            const _accounts = await ethereum.request({
                method: 'eth_accounts',
            });
            console.log(_accounts)
            return _accounts[0] || null;
        } catch (err) {
            console.error(`Error: ${err.message}`);
            return null
        }
    }

    async getEncryptionKey() {
        try {
            const encryptionKey = await ethereum.request({
                method: 'eth_getEncryptionPublicKey',
                params: [this.accounts[0]],
            });
            return encryptionKey
        } catch (error) {
            console.error(`Error: ${error.message}`);
            return null
        }
    }

    async ethSign(msg) {
        try {
            const result = await ethereum.request({
                method: 'eth_sign',
                params: [this.accounts[0], msg],
            });
            console.log(JSON.stringify(ethResult));
            return result
        } catch (err) {
            console.error(`Error: ${err.message}`);
        }
    };

    async personalSign(msg, password) {
        
        try {
            const from = this.accounts[0];
            const _msg = `0x${Buffer.from(msg, 'utf8').toString('hex')}`;
            const sign = await ethereum.request({
                method: 'personal_sign',
                params: [_msg, from, password],
            });
            console.log(sign);
            return sign
        } catch (err) {
            console.error(`Error: ${err.message}`);
        }
    };

    async getNetworkAndChainId() {
        try {
            const chainId = await ethereum.request({
                method: 'eth_chainId',
            });

            const networkId = await ethereum.request({
                method: 'net_version',
            });

            const block = await ethereum.request({
                method: 'eth_getBlockByNumber',
                params: ['latest', false],
            });
            
            console.log(`chainId: ${ chainId }, networkId: ${ networkId }, blockNumber: ${ block.number }`)

            return {
                chainId, 
                networkId, 
                block
            }
        } catch (err) {
            console.error(err);
        }
    }
}