## [2.0.6](https://github.com/PrimeDAO/prime-launch-dapp/compare/2.0.5...2.0.6) (2022-12-06)


### Bug Fixes

* **elements.NetworkFeedback:** check for mainnet (including celo) ([a491f1f](https://github.com/PrimeDAO/prime-launch-dapp/commit/a491f1fa36becc3dc3dac09e191410eaf77d35f9))


### Features

* **app:** add /version path ([c6e53e4](https://github.com/PrimeDAO/prime-launch-dapp/commit/c6e53e4a53e1cb1f155987e952cf8628b3e499ce))
* **seedSale.Kolektivo:** update Kol link ([a7c9aa1](https://github.com/PrimeDAO/prime-launch-dapp/commit/a7c9aa1ae2286c1a20bc9a5d1c67e24d877bb558))



## [2.0.5](https://github.com/PrimeDAO/prime-launch-dapp/compare/2.0.4...2.0.5) (2022-12-06)


### Bug Fixes

* **main:** ENV var should be strongest ([9dce0cd](https://github.com/PrimeDAO/prime-launch-dapp/commit/9dce0cd3a815e3e162a1320536a787a14af60e4e))


### Features

* **services.Ethereum:** add main- and testnet check-functions ([00be51d](https://github.com/PrimeDAO/prime-launch-dapp/commit/00be51df763b7766829a4603e519131e41362bf4))
* **services.Seed:** increase Celo startingBlocknumber ([9215593](https://github.com/PrimeDAO/prime-launch-dapp/commit/9215593ebcd19e243cb98cf5c9260589514ba6e2))



## [2.0.4](https://github.com/PrimeDAO/prime-launch-dapp/compare/v2.0.3...2.0.4) (2022-12-05)


### Bug Fixes

* **entities.Seed:** truncate value Reason: ethers.BigNumber does not work with decimals .. ([9f48350](https://github.com/PrimeDAO/prime-launch-dapp/commit/9f48350e2c670e0954939ec4620e87a8f5bb3c2c))


### Features

* **appVersion:** add version page ([0799fe6](https://github.com/PrimeDAO/prime-launch-dapp/commit/0799fe629f5b96f3a79f004a0ce35173312e92a3))
* **elements:** featured: add bindable to show all launches ([e1bd289](https://github.com/PrimeDAO/prime-launch-dapp/commit/e1bd2893f674c42b052f81d32a369a6477e20249))
* **seedSale:** add custom text for kolektivo (not allowlisted case) ([74d11d0](https://github.com/PrimeDAO/prime-launch-dapp/commit/74d11d0bab53a9fe08555400001273bcd198af25))
* **seedSale:** Hide Class Information for Addresses That Are Not In The Allowlist ([74943b2](https://github.com/PrimeDAO/prime-launch-dapp/commit/74943b22df50739474bf5953cc2b63165791af05))
* **seedSale:** let page be empty, if no seed found .. ([bc86e65](https://github.com/PrimeDAO/prime-launch-dapp/commit/bc86e656de03d7c330232dd3afac29e9fe3e3215))
* **seedSale:** update error, when seed not found ([ff85064](https://github.com/PrimeDAO/prime-launch-dapp/commit/ff85064ae9b0d52ad065dd13e3cb47d5d53d9538))
* **services.Ethereum:** isLocalhostUrl and refac to use that ([5448746](https://github.com/PrimeDAO/prime-launch-dapp/commit/5448746822edfdb674264d140f1691b121ca4d69))



## [2.0.3](https://github.com/PrimeDAO/prime-launch-dapp/compare/v2.0.2...v2.0.3) (2022-12-02)


### Bug Fixes

* **adminDashboard:** addClass: add validation for vesting+ cliff ([45c6cb3](https://github.com/PrimeDAO/prime-launch-dapp/commit/45c6cb36a41acb1392cd347566e3445f3f9f4958))
* **adminDashboard:** addClass: correct decimals ([b69c5bd](https://github.com/PrimeDAO/prime-launch-dapp/commit/b69c5bd8162def4121c37d9f6fd8cb6c88a79877))
* **adminDashboard:** addClass: the way csv is split ([538c12b](https://github.com/PrimeDAO/prime-launch-dapp/commit/538c12b43c65c61887421ed69ace8b893cd7c081))
* **adminDashboard:** adjust getters ([e98153f](https://github.com/PrimeDAO/prime-launch-dapp/commit/e98153f5c7878af2b8966e73610e91d5c6600854))
* **adminDashboard:** allow editing mulitple ([45e4309](https://github.com/PrimeDAO/prime-launch-dapp/commit/45e430929b3b756f08d7126e0a8ffb6813c32282))
* **adminDashboard:** cancel and reseting edited ([581a85e](https://github.com/PrimeDAO/prime-launch-dapp/commit/581a85ea11f3091887b0d6e25709506f369e6278))
* **adminDashboard:** classe warning copy ([24f0348](https://github.com/PrimeDAO/prime-launch-dapp/commit/24f03483f9c73a368af1790bcace2fcfba51657c))
* **adminDashboard:** default to Set when allowlist not given ([a994e5a](https://github.com/PrimeDAO/prime-launch-dapp/commit/a994e5ad886d6444342e5b3b0fa220b641b1f8c4))
* **adminDashboard:** only show classes for seed v2 ([7f6921a](https://github.com/PrimeDAO/prime-launch-dapp/commit/7f6921a460b399bb775216fa1ec637bb140514ca))
* **adminDashboard:** word wrap for title ([6fa8cb8](https://github.com/PrimeDAO/prime-launch-dapp/commit/6fa8cb8d16127de2706434ceda92608523d2768b))
* **app:** change network button text ([ff21e0c](https://github.com/PrimeDAO/prime-launch-dapp/commit/ff21e0cbe1bb1ceba257e8491f4689fddfa12435))
* **dialogs:** alert: order of buttons ([ca56b5f](https://github.com/PrimeDAO/prime-launch-dapp/commit/ca56b5f0110cbb8943117897f6d007576af134f8))
* **elements:** NetworkFeedback: only show Mainnet for network===mainnet ([85db1cd](https://github.com/PrimeDAO/prime-launch-dapp/commit/85db1cd68f6c5a60fd8aba95cd651e70e0d6c509))
* **elements:** timeLeft: display time in uninitialized but started case ([202fe55](https://github.com/PrimeDAO/prime-launch-dapp/commit/202fe55d0e74e62e2f2fe55e9eb74820585544e5))
* **elements:** timeLeft: isDead -> complete ([8706cbb](https://github.com/PrimeDAO/prime-launch-dapp/commit/8706cbbeaef98a670a9f546d327d33b8cb8031c4))
* **entities:** addresses to lowercase ([7159660](https://github.com/PrimeDAO/prime-launch-dapp/commit/7159660db5f23524dcf645d4df2b926cd8310583))
* **entities:** Seed: add getTipAmountFromFunding ([136a1be](https://github.com/PrimeDAO/prime-launch-dapp/commit/136a1beec1c0b546d92e34fab30d2bc1b517b43d))
* **entities:** Seed: await hydration (so other places can update) ([003381b](https://github.com/PrimeDAO/prime-launch-dapp/commit/003381b989e202596388b8529997d478b2cba201))
* **entities:** Seed: calc end correct again ([9f3b6c9](https://github.com/PrimeDAO/prime-launch-dapp/commit/9f3b6c96368a2d3f633afbced950240c2bb69682))
* **entities:** Seed: check for account is allowlisted ([28e334a](https://github.com/PrimeDAO/prime-launch-dapp/commit/28e334ab9fcb56a1fe21c4fe96189daa7cb398f9))
* **entities:** Seed: differentiate v1 and v2 hydrating ([b6c8fe0](https://github.com/PrimeDAO/prime-launch-dapp/commit/b6c8fe0349770c400a8d3d401af453a1b32d1e8c))
* **entities:** Seed: swap endsInMillisecends order again ([6c79346](https://github.com/PrimeDAO/prime-launch-dapp/commit/6c7934645775f9eb76bf375cdfea75e99e0440ad))
* **entities:** Seed: turn into getter ([6a80c32](https://github.com/PrimeDAO/prime-launch-dapp/commit/6a80c321b9c368c89f5584d7308888b128f631d7))
* **entities:** Seed.ts: make seed load in UI (update contracts calls) ([032836f](https://github.com/PrimeDAO/prime-launch-dapp/commit/032836f2003d283d1074cfeb3b85aed67e7bfab0))
* **entities:** use correct bytes32 parse function ([1934f87](https://github.com/PrimeDAO/prime-launch-dapp/commit/1934f87ce6143cc6d10a974769e0a5c1ff2488ee))
* **home:** all launches ([28253a3](https://github.com/PrimeDAO/prime-launch-dapp/commit/28253a3c3fab198f54f7f4fb20c6a63cdaffafa3))
* **launch:** webpack5 svg handling and styles ([b749d95](https://github.com/PrimeDAO/prime-launch-dapp/commit/b749d9557aedef8e700db5c23718b5c840c7bee0))
* **launch:** webpack5 svg handling and styles ([8713220](https://github.com/PrimeDAO/prime-launch-dapp/commit/8713220aca4b848194c4df7f3cafe5cbdfce42d1))
* **main:** disable lbp for celo like ([c95407f](https://github.com/PrimeDAO/prime-launch-dapp/commit/c95407ff0a6f6155672bbfba514a134b1b8c9353))
* **main:** disable lbp for localhost ([2ae5afc](https://github.com/PrimeDAO/prime-launch-dapp/commit/2ae5afcd0fa8e1eb05f22f5ee90019fbc4073fcc))
* **main:** remove dupe func def ([82120ba](https://github.com/PrimeDAO/prime-launch-dapp/commit/82120ba2cd7b41c6b238b4329d8d51cff96cad62))
* **navbar:** checking dev addresses ([0707c4d](https://github.com/PrimeDAO/prime-launch-dapp/commit/0707c4d9d31f7ba59ded0aa92fb13aa3d08e38a0))
* **network:** fallback if stored network not present ([783bffd](https://github.com/PrimeDAO/prime-launch-dapp/commit/783bffd1d37d906fd47fa7f797fb55d31dab134a))
* **network:** fallback if stored network not present ([11f079d](https://github.com/PrimeDAO/prime-launch-dapp/commit/11f079d4f90a338e99c6aac54c1dca41acd51cc4))
* **network:** fallback if stored network not present ([009cc1c](https://github.com/PrimeDAO/prime-launch-dapp/commit/009cc1c683a69df1bee09d55ba645cc6981c661f))
* **network:** fallback if stored network not present ([c55c2a2](https://github.com/PrimeDAO/prime-launch-dapp/commit/c55c2a2bb0789bab0636d339dfb3559e27eb41e8))
* **pkg:** scripts and webpack parameters, that take --env ([0f8edcc](https://github.com/PrimeDAO/prime-launch-dapp/commit/0f8edcc8703f86f9003cb0fd1c2a480cad94d903))
* **seed.caps:** wizard and admin dashboard validation ([1e065a9](https://github.com/PrimeDAO/prime-launch-dapp/commit/1e065a974628e8532db8388e0dd5a86cb50acb4a))
* **seedDashboard:** claim section (label) ([e91a9b3](https://github.com/PrimeDAO/prime-launch-dapp/commit/e91a9b3b025d348e17ddf99121e99d4721492c16))
* **seedDashboard:** class sold mantissa to 2 ([4760965](https://github.com/PrimeDAO/prime-launch-dapp/commit/4760965c4f43fafeba938a3ca809a92e2b7e0b8f))
* **seedDashboard:** class sold ui part ([b0c206c](https://github.com/PrimeDAO/prime-launch-dapp/commit/b0c206c078ade8734af5dbeabdce6ac788a659cb))
* **seedDashboard:** class sold updates after user contributed ([c8389dc](https://github.com/PrimeDAO/prime-launch-dapp/commit/c8389dcedb896f7f7f11df397b9e3fe2bdf57c0b))
* **seedDashboard:** classSold now correct values ([9bc6434](https://github.com/PrimeDAO/prime-launch-dapp/commit/9bc6434e8339be0075a695209f7e651976be2df0))
* **seedDashboard:** connect claim ([729ceeb](https://github.com/PrimeDAO/prime-launch-dapp/commit/729ceebfc640b753b68c3e05a3b0c940543fe40e))
* **seedDashboard:** disable pending input ([b029f22](https://github.com/PrimeDAO/prime-launch-dapp/commit/b029f228bfcd8bae45eff0f3b185599ebf1cbec3))
* **seedDashboard:** max buy now does not overshoot ([e1cd0ea](https://github.com/PrimeDAO/prime-launch-dapp/commit/e1cd0eace0ccbed92493375552fb4c2188b62ab5))
* **seedDashboard:** re-add pending amount ([203ea80](https://github.com/PrimeDAO/prime-launch-dapp/commit/203ea803159f8716ca6f13dd8ded4a3460b9a34a))
* **seedDashboard:** re-add user balance ([3503de9](https://github.com/PrimeDAO/prime-launch-dapp/commit/3503de99ecf83b1ddf23e64348b7b6adba74d9dc))
* **seedDashboard:** retrive button ([0afadde](https://github.com/PrimeDAO/prime-launch-dapp/commit/0afadde17f6f621b132dbfcef71c7ac4ba056472))
* **seedDashboard:** unlock button potision ([f922dc2](https://github.com/PrimeDAO/prime-launch-dapp/commit/f922dc2b4a1d5155984bbcb27aa51160d23091d9))
* **seedDashboard:** use correct token kind (=project Token) ([cff5eb0](https://github.com/PrimeDAO/prime-launch-dapp/commit/cff5eb0f80afaec7beacdb1dd19d6cd4cf9b2d53))
* **seedDashboard:** use user funding value ([b5ec239](https://github.com/PrimeDAO/prime-launch-dapp/commit/b5ec239c254e62336ce069af699c2c2fc5b29f7a))
* **seedSale:** add case for HardCap - TotalRaised for maxbuy ([2583a3f](https://github.com/PrimeDAO/prime-launch-dapp/commit/2583a3f0013eb3993c682445ffe5c28bb0e0fb1d))
* **seedSale:** await seed class data ([dee6b4e](https://github.com/PrimeDAO/prime-launch-dapp/commit/dee6b4e8a976d88ee82381b092ff5c9064afa586))
* **seedSale:** bottom section with all links ([982d201](https://github.com/PrimeDAO/prime-launch-dapp/commit/982d201e31166e8f412ba4dd544c1b910a3ef7e8))
* **seedSale:** check for hasReached also for individualCap ([ea60f2e](https://github.com/PrimeDAO/prime-launch-dapp/commit/ea60f2e94073bc342d1e131a6aa83c58ccde9421))
* **seedSale:** claim button should disable when no value (or 0) ([2f43b68](https://github.com/PrimeDAO/prime-launch-dapp/commit/2f43b6853e36a3e93faa29f50eb1f5b05e6ee15e))
* **seedSale:** disable claiming properly (like v1) ([7799f02](https://github.com/PrimeDAO/prime-launch-dapp/commit/7799f02ccf84d940373c56ee2a2db932de539420))
* **seedSale:** disable max button when not connected ([03dfa0a](https://github.com/PrimeDAO/prime-launch-dapp/commit/03dfa0a449603e263ec3ffbceb87317dc6c69817))
* **seedSale:** disable when not claimable ([ec99019](https://github.com/PrimeDAO/prime-launch-dapp/commit/ec9901964df9bfd582c8d350f11e450a7c6e0372))
* **seedSale:** don't display time once over ([ca1f701](https://github.com/PrimeDAO/prime-launch-dapp/commit/ca1f701a736f5a828c578ea28f0b469bcf5c3498))
* **seedSale:** don't show class for v1 seeds ([cc2b04b](https://github.com/PrimeDAO/prime-launch-dapp/commit/cc2b04ba18db7c5c9813ab39f0b4d59f308b0397))
* **seedSale:** geoblock and allowlist logic ([6bf51c7](https://github.com/PrimeDAO/prime-launch-dapp/commit/6bf51c7f216052b832783929aef84dd303ec2bf5))
* **seedSale:** guard for !seed ([f83de25](https://github.com/PrimeDAO/prime-launch-dapp/commit/f83de25b7f08211ef7348266d10b67923b987431))
* **seedSale:** guard for seed.usersClass ([c187695](https://github.com/PrimeDAO/prime-launch-dapp/commit/c18769575ae174ef8c3dc84fe3f89eba62c1b0f1))
* **seedSale:** max handling with indivdual cap as well ([bfb9229](https://github.com/PrimeDAO/prime-launch-dapp/commit/bfb922915484ffc3b0ac9719240937037448f573))
* **seedSale:** only allow claim when connected ([6e9b7ac](https://github.com/PrimeDAO/prime-launch-dapp/commit/6e9b7acc0e1625906080817a5d5cec2a5d6029c3))
* **seedSale:** optional-chain in if ([0b363e7](https://github.com/PrimeDAO/prime-launch-dapp/commit/0b363e75e583b4d271a4d5fedcf34018b58ef38d))
* **seedSale:** progress bar complete color ([eee281d](https://github.com/PrimeDAO/prime-launch-dapp/commit/eee281d569586282700f32c571fda9ef81ff7812))
* **seedSale:** remove "SEED" ([8192848](https://github.com/PrimeDAO/prime-launch-dapp/commit/819284804364e2439233e722d7b8dda7276d6d8b)), closes [52426#318835394](https://github.com/52426/issues/318835394)
* **seedSale:** should show indivCap ([0795adf](https://github.com/PrimeDAO/prime-launch-dapp/commit/0795adf5ede1626e1b957ef17e996657df863bb1))
* **seedSale:** should show project token above progress bar ([fd97295](https://github.com/PrimeDAO/prime-launch-dapp/commit/fd97295fa64fab431f7ecde1070dd8ea18056c77))
* **seedSale:** tooltip width and wait for data loaded ([3e95958](https://github.com/PrimeDAO/prime-launch-dapp/commit/3e959584aa41c45847b95b4e9333317283def1d9))
* **seedSale:** tooltip width and wait for data loaded ([58a289e](https://github.com/PrimeDAO/prime-launch-dapp/commit/58a289e0b84d76921210df979d677bcfdc3aaec4))
* **seedSale:** unaligned contribute inputs ([77934ff](https://github.com/PrimeDAO/prime-launch-dapp/commit/77934ffa8eca9c9440bdfb356bfc945ba0244dea))
* **seedSale:** use cliff from classes ([ac42e6a](https://github.com/PrimeDAO/prime-launch-dapp/commit/ac42e6a9fb2418eb3a8a07da024a2bd9984e26e6))
* **seedSale:** use funding token logo ([f39c5bb](https://github.com/PrimeDAO/prime-launch-dapp/commit/f39c5bb41a01fc3b2e4f5e8b771767152da6d8cd))
* **seedSale:** userCanPay logic: gt -> gte ([6494131](https://github.com/PrimeDAO/prime-launch-dapp/commit/6494131ea7c003836f65ef16c032f91e565ad77c))
* **seedSale:** wait for token address to load balance ([1409cfb](https://github.com/PrimeDAO/prime-launch-dapp/commit/1409cfb320e8ed8e16e16dcc8ce1ccd1b652de14))
* **services:** Balancer: correct network ([1c916b7](https://github.com/PrimeDAO/prime-launch-dapp/commit/1c916b77c3ddf864726a3cba5673ac999ef8f289))
* **services:** Contracts improve error msg, and remove contracts on celo-like ([625769d](https://github.com/PrimeDAO/prime-launch-dapp/commit/625769ddc2df1c5c2f8fc7ce7ad19d434212d532))
* **services:** Ethereum: new alfajores rpc url ([649a745](https://github.com/PrimeDAO/prime-launch-dapp/commit/649a74575773b232b4362814db6dc6c9226bd846))
* **services:** Ethereum: typo .. -> Goerli ([915342a](https://github.com/PrimeDAO/prime-launch-dapp/commit/915342ab113c5db036dc470aa994199fe507973a))
* **services:** for history price, default to 0, when no value ([c7d5617](https://github.com/PrimeDAO/prime-launch-dapp/commit/c7d56170bea6afd3548eb31611db6e7fd4b9b2d4))
* **services:** Geoblock: localhost should be okay ([3b9272a](https://github.com/PrimeDAO/prime-launch-dapp/commit/3b9272a7771080e39fa16bddcf6d2ee99c472144))
* **services:** gnosis goerli endpoint ([4689eb1](https://github.com/PrimeDAO/prime-launch-dapp/commit/4689eb1eb46bb91e1bbb6649f8487bb8a7b9a412))
* **services:** Number: add default option ([3a81dca](https://github.com/PrimeDAO/prime-launch-dapp/commit/3a81dcaf0284d05b536b12cea887216782533408))
* **services:** Number: linter/ts-compiler "used before assigned" ([eab498a](https://github.com/PrimeDAO/prime-launch-dapp/commit/eab498a220506a84e1f0e4a900c263d5cd06f7f3))
* **services:** remove dupe function ([9a4ab36](https://github.com/PrimeDAO/prime-launch-dapp/commit/9a4ab36413e885f279921cc161345a98b856cb41))
* **services:** remove dupe function ([00efcf9](https://github.com/PrimeDAO/prime-launch-dapp/commit/00efcf916ac944a9bef9c287d960707b6dfb496c))
* **services:** Seed: default allowlist ([fc15295](https://github.com/PrimeDAO/prime-launch-dapp/commit/fc15295e3a62a6cb8939837528d8a231ef9e7b8a))
* **services:** Seed: nonce from service (in all non-celo) ([c2a8788](https://github.com/PrimeDAO/prime-launch-dapp/commit/c2a878875d53e541003a5bf39347fae2be19c32f))
* **services:** Seed: use indivCap for classes ([3c7cea0](https://github.com/PrimeDAO/prime-launch-dapp/commit/3c7cea048ae3135f7e439f95e0da2bcea0aade6b))
* **services:** take allowlist from config (wizard) ([2921f2e](https://github.com/PrimeDAO/prime-launch-dapp/commit/2921f2ed796ee2a553448af7aa939d3fd53c477c))
* **services:** take allowlist from config (wizard) ([d7f6d5b](https://github.com/PrimeDAO/prime-launch-dapp/commit/d7f6d5b4cdbe5d0297ce215f291b667ceac140b2))
* **services:** Token: uri on prod build ([19638f8](https://github.com/PrimeDAO/prime-launch-dapp/commit/19638f83c11b4e5a359961ae5ed3daeee6c27d1a))
* **shared:** Seed: use indivCap for classes ([9f4865f](https://github.com/PrimeDAO/prime-launch-dapp/commit/9f4865fb5140ff50eb571057f1da3478f2d56c13))
* **timeLeft:** don't show 2 status ([05952d2](https://github.com/PrimeDAO/prime-launch-dapp/commit/05952d2f4b416f6e51db07c01632ea6a1586d71a))
* **timeLeft:** show "xy minutes" (instead of  "0 hours") ([7ad4ddc](https://github.com/PrimeDAO/prime-launch-dapp/commit/7ad4ddc699bc2e05b8bf4f6dac4795304de47ef9))
* **wizard.Seed:** disable cursor for endTime clock ([06f86f4](https://github.com/PrimeDAO/prime-launch-dapp/commit/06f86f4023cd5c51afd5e73b5968431eb1a600ff))
* **wizard.Seed:** remove dev text in copy ([b602358](https://github.com/PrimeDAO/prime-launch-dapp/commit/b602358791225a99df7dea9ee9addfda6008d33f))
* **wizard.seed:** remove obsolete text ([e2fb7e2](https://github.com/PrimeDAO/prime-launch-dapp/commit/e2fb7e277d6d47f985bd45e5bd53e09ab527321b))
* **wizard.Seed:** swap exchange ratio copy ([aab2f82](https://github.com/PrimeDAO/prime-launch-dapp/commit/aab2f828a062972a384b42765204ff95ca28e7a7))
* **wizard.Seed:** swap exchange ratio copy ([aab7651](https://github.com/PrimeDAO/prime-launch-dapp/commit/aab765168c9352a2fc6a792d5c8123384c12a40a))
* **wizard.Seed:** swap exchange ratio copy ([dbb6334](https://github.com/PrimeDAO/prime-launch-dapp/commit/dbb6334db9a914c7d6e7f676e015b36d66f6cf1c))
* **wizard.Seed:** swap exchange ratio copy ([ae03e44](https://github.com/PrimeDAO/prime-launch-dapp/commit/ae03e44cd9045bb0ea7eccaef9eeed66d4de06e9))
* **wizard.seed:** text copy for permissoned toggle ([5ec0f4e](https://github.com/PrimeDAO/prime-launch-dapp/commit/5ec0f4ef5acd27e2766dac4b188db7e32cffcf83))
* **wizard.Seed:** the way csv is split ([8820a41](https://github.com/PrimeDAO/prime-launch-dapp/commit/8820a411a9e2bed5b2d754a29b79e58aa3a276d2))
* **wizard.stage4:** text copy ([637d778](https://github.com/PrimeDAO/prime-launch-dapp/commit/637d77838683f352e86130bf3984f3ffc0ccb908))
* **wizard.submit:** correct Funding token (not project) ([27a5059](https://github.com/PrimeDAO/prime-launch-dapp/commit/27a5059e24acef11a89b4e2a1f7c91ea2d09a9eb))
* **wizard.submit:** hide when previous steps not completed ([2475b34](https://github.com/PrimeDAO/prime-launch-dapp/commit/2475b34742b5176b6d347e969cffc6a61137cfdf))
* **wizard.tokens:** init in `bind` (attached too late) ([6286515](https://github.com/PrimeDAO/prime-launch-dapp/commit/6286515e0150b739d475b01e82c4d9ceb2436cb5))
* **wizard.tokens:** init in `bind` (attached too late) ([6451707](https://github.com/PrimeDAO/prime-launch-dapp/commit/645170710c1ea5fdbd66e7b7a1433124c5ce638d))


### Features

* **adminDasboard:** add amount to fund with tip added ([16fb503](https://github.com/PrimeDAO/prime-launch-dapp/commit/16fb503473bac508e6a014479d6d9885c43c9fb5))
* **adminDashboard:** add correct tipping text copy ([32c37d3](https://github.com/PrimeDAO/prime-launch-dapp/commit/32c37d3dcb3e3b228708048fbd69f2b01ef6b278))
* **adminDashboard:** button and thousand-sep ([9b84db7](https://github.com/PrimeDAO/prime-launch-dapp/commit/9b84db7ae5a14788ca99daddce3a1d6719dc8f98))
* **adminDashboard:** disable class interaction once started ([e2c2070](https://github.com/PrimeDAO/prime-launch-dapp/commit/e2c2070d5acefa0b60b17ceff80f2d989ac07e24))
* **adminDashboard:** revert edited classes on fail ([79e688f](https://github.com/PrimeDAO/prime-launch-dapp/commit/79e688fea666cfdf6392b647bd0de83adc4cd5b4))
* **app:** adjust buttons text ([3bb826d](https://github.com/PrimeDAO/prime-launch-dapp/commit/3bb826d840d0bf13ca5eb24dfa63f8f76c5774ca))
* **dialogs:** addClass: add funding token symbol to text ([61e84d8](https://github.com/PrimeDAO/prime-launch-dapp/commit/61e84d84733d68848d7f085755754ffe40158fbd))
* **dialogs:** addClass: adjust styles and copy ([a79d8dc](https://github.com/PrimeDAO/prime-launch-dapp/commit/a79d8dc8130b64c3ddd228cb206875e9b856584d))
* **dialogs:** alert: arg to obj, and add className, and button text customization ([151b659](https://github.com/PrimeDAO/prime-launch-dapp/commit/151b6599077371dfde1609ee1352db7d986a4e26))
* **docs:** update docs link to external side ([f0f02af](https://github.com/PrimeDAO/prime-launch-dapp/commit/f0f02af20c6982a476bf0eac79678425f71d551b))
* **elements:** featured: add bindable to show all launches ([3b429c7](https://github.com/PrimeDAO/prime-launch-dapp/commit/3b429c7d29d703a643c652ede27e50e8e4f354a1))
* **elements:** featured: add bindable to show all launches ([e1bd289](https://github.com/PrimeDAO/prime-launch-dapp/commit/e1bd2893f674c42b052f81d32a369a6477e20249))
* **entities:** Seed: add disclaimer check ([8f3418a](https://github.com/PrimeDAO/prime-launch-dapp/commit/8f3418a16b9344b34bae9dced6a457e7e642ba04))
* **entities:** Seed: support for localhost metadata ([9793ff5](https://github.com/PrimeDAO/prime-launch-dapp/commit/9793ff58c69ce71db7fe9c8d26cc694b7e65cad7))
* **entities:** Seed: update change class name (reason: contract update) ([24406e3](https://github.com/PrimeDAO/prime-launch-dapp/commit/24406e386b20c43978b49caf1ca0e9040d8f8808))
* **main:** add VPN notice to error ([1669a1c](https://github.com/PrimeDAO/prime-launch-dapp/commit/1669a1c4d8e54fa254ce5a6775450b8f2d2476d9))
* **resources:** new valueConv sec2Millis ([43956e7](https://github.com/PrimeDAO/prime-launch-dapp/commit/43956e75d38c8a384588a72336cc8938b919fed9))
* **seedOverview:** add calcClaimForFunder contract call ([297b371](https://github.com/PrimeDAO/prime-launch-dapp/commit/297b371d8717c2ad0a0f8deaf6e775910b719687))
* **seedOverview:** add contracts call for funding token ([6d7f2c7](https://github.com/PrimeDAO/prime-launch-dapp/commit/6d7f2c7fb089be66caf99c5274f606191f402b40))
* **seedSale:** also hydrate class ([44a3f7d](https://github.com/PrimeDAO/prime-launch-dapp/commit/44a3f7d0c205c7b2a07789e1520662c39777b472))
* **seedSale:** make it reactive ([556af0d](https://github.com/PrimeDAO/prime-launch-dapp/commit/556af0d69a994b6d7f80e6e8ee2b991922bcb84a))
* **services:** adjust gnosis for alfajores ([98c423b](https://github.com/PrimeDAO/prime-launch-dapp/commit/98c423ba5bdec00626674e142b9727f7d193a0f8))
* **services:** Alert: adjust to object param ([661dff3](https://github.com/PrimeDAO/prime-launch-dapp/commit/661dff3cfe5e6bfeb0b2ceb5b66cfb8c6c7d7d36))
* **services:** BigNumber: add asPercentageToNumber ([cb48b22](https://github.com/PrimeDAO/prime-launch-dapp/commit/cb48b227178d8eb1f6c8a0ec7e78efd5708a082c))
* **services:** BigNumber: add fraction (returns number) ([b1ceaba](https://github.com/PrimeDAO/prime-launch-dapp/commit/b1ceaba37009ed691a6fd9e1143ced76cdc9850b))
* **services:** Contracts: add SeedFactoryNoAccessControl ([cb30c67](https://github.com/PrimeDAO/prime-launch-dapp/commit/cb30c67d8b65a367e9e6565f78517409902f12c4))
* **services:** divide and fractionString ([6ca0f7c](https://github.com/PrimeDAO/prime-launch-dapp/commit/6ca0f7cd1c71d77e78025a133e9e5b99412a04ac))
* **services:** Ethereum mocking for cypress ([03db9b7](https://github.com/PrimeDAO/prime-launch-dapp/commit/03db9b720c1bdbfa3d9ed3edacb8031dad8be6cc))
* **services:** Ethereum: add method isNetwork ([b5fdfcf](https://github.com/PrimeDAO/prime-launch-dapp/commit/b5fdfcf5fb371c08c35f5fff357b2f95152066b4))
* **services:** EthereumTesting: add some methods ([052f39b](https://github.com/PrimeDAO/prime-launch-dapp/commit/052f39b91418d03f72d2e4be14447b3d7278be84))
* **services:** init StringService ([11fd9f5](https://github.com/PrimeDAO/prime-launch-dapp/commit/11fd9f51139ea22ce917939a3ad381ba9bbe4876))
* **services:** Seed: add support for SeedFactoryNoAccessControl deployment ([ddc5ea7](https://github.com/PrimeDAO/prime-launch-dapp/commit/ddc5ea735c74afcbe32df388986c6a3aaa0548e6))
* **services:** Seed: deploySeed: add support for alfajores ([db2e174](https://github.com/PrimeDAO/prime-launch-dapp/commit/db2e174a6a1a1ea624032d5b893902279b720d8b))
* **services:** Seed: increase starting block for seed ([679b48c](https://github.com/PrimeDAO/prime-launch-dapp/commit/679b48c6f4413268b3e3d33eef6e556f633cc3c7))
* **shared:** add time related ([dc70a57](https://github.com/PrimeDAO/prime-launch-dapp/commit/dc70a5722cd434d4fd7d7e7d7ba213a3c3b8bd8b))
* **shared:** invere-objects.ts init ([04cb128](https://github.com/PrimeDAO/prime-launch-dapp/commit/04cb128d7b975cfc249577d8f336f7001e338e47))
* **wizard.seed:** add validation for Funding Token Contribution Limit ([2ceeb9f](https://github.com/PrimeDAO/prime-launch-dapp/commit/2ceeb9fa57c2c4b67eb0258228db0e5ead994d0f))
* **wizard.Seed:** improve tootlip for csv ([99b9774](https://github.com/PrimeDAO/prime-launch-dapp/commit/99b9774a8bbc83d5247ea133c018c227262c6d81))
* **wizard.seed:** make tipping optional ([b637185](https://github.com/PrimeDAO/prime-launch-dapp/commit/b637185670b8e346ee264dbc46ce10397c87cbad))
* **wizard.seed:** make truely optional ([6ce5442](https://github.com/PrimeDAO/prime-launch-dapp/commit/6ce5442462bc93b580f38482e6bedd61e9a6403f))


### Reverts

* Revert "dev(buttons): remove" ([52d3146](https://github.com/PrimeDAO/prime-launch-dapp/commit/52d31462effd879e2ebe5a9400b3a919784bb5d8))



## [1.0.1-alpha.1](https://github.com/PrimeDAO/prime-launch-dapp/compare/v1.0.0...v1.0.1-alpha.1) (2022-10-12)


### Bug Fixes

* **adminDashboard:** show classes (TODO: ([35c7fff](https://github.com/PrimeDAO/prime-launch-dapp/commit/35c7fffb23d29dd7ab2864e4aa33186740d10668))
* **adminDashboard:** show classes (TODO: ([82526b7](https://github.com/PrimeDAO/prime-launch-dapp/commit/82526b7758d7de8dcb6cf1eee306120a8c7875c3))
* **entities.Seed:** ?? to funders ([8bed1b3](https://github.com/PrimeDAO/prime-launch-dapp/commit/8bed1b3ce85fde0d42323e9b82540f2e0b5074f2))
* **entities:** start time: switch order (was showing minus days) ([a4e3326](https://github.com/PrimeDAO/prime-launch-dapp/commit/a4e3326921862c78f3b83179525a56aed6e1fd7b))
* **entities:** switch order (was showing minus days) ([4e74a1c](https://github.com/PrimeDAO/prime-launch-dapp/commit/4e74a1c3b63850829df0615b5ce3d2ee4ff55c75))
* **entities:** switch order (was showing minus days) ([a8e02db](https://github.com/PrimeDAO/prime-launch-dapp/commit/a8e02db0a91995c56942d7d49f656371f19251d7))
* **entities:** temp setting of class name ([888b300](https://github.com/PrimeDAO/prime-launch-dapp/commit/888b3004de0899fe82f40f90261bfa5c429c2544))
* **launchCards:** date format ([46abacb](https://github.com/PrimeDAO/prime-launch-dapp/commit/46abacb2efae606df16fc9b1c091a893c4b13daa))
* **seedDashboard:** allow "gte", because exact amount should also be possible ([6bd46c1](https://github.com/PrimeDAO/prime-launch-dapp/commit/6bd46c100e1d43f2ec6cdedfe76c47ecaf73d7a8))
* **seedDashboard:** allow "gte", because exact amount should also be possible ([4773a2a](https://github.com/PrimeDAO/prime-launch-dapp/commit/4773a2a1e84d1e3aaf559c1904b63c52f818ee0e))
* **seedDashboard:** init <timeLeft> when `seed` is available ([203244d](https://github.com/PrimeDAO/prime-launch-dapp/commit/203244d135bebfc1029899743f417c0058178a92))
* **seedDashboard:** init <timeLeft> when `seed` is available ([d16ea28](https://github.com/PrimeDAO/prime-launch-dapp/commit/d16ea28c4604549b1e59530062a13b3f04eb966c))
* **seedDashboard:** max button takes correct min now ([73febb0](https://github.com/PrimeDAO/prime-launch-dapp/commit/73febb06681db7b420ba0960a6720f2baa9ef7f4))
* **seedDashboard:** this.seed undefined ([52dcf09](https://github.com/PrimeDAO/prime-launch-dapp/commit/52dcf0957439faa496e244a82a26e6155695db5c))
* **seedDashboard:** this.seed undefined ([8ebb53d](https://github.com/PrimeDAO/prime-launch-dapp/commit/8ebb53d731c8ddfc5682a565fc105362692d8718))
* **seedDashboard:** timeLeft, and sorry-not-whitelisted or geoblocked ([e2f34ff](https://github.com/PrimeDAO/prime-launch-dapp/commit/e2f34ff8758c59851b6626158e1cd6d47577d3a4))
* **seedDashboard:** timeLeft, and sorry-not-whitelisted or geoblocked ([c6f8261](https://github.com/PrimeDAO/prime-launch-dapp/commit/c6f8261a3d818313f23d68c745096ce6d607db6a))
* **wizard.seed:** remove celo import (from future work) ([5c5a550](https://github.com/PrimeDAO/prime-launch-dapp/commit/5c5a55063fbde4249515838736fee00a2266ae81))
* **wizard.Seed:** swap exchange ratio copy ([dbeb6a4](https://github.com/PrimeDAO/prime-launch-dapp/commit/dbeb6a4847c1648b87b1cad866ed2cce6b3bfcb8))
* **wizard.Seed:** take network name ([c85cb34](https://github.com/PrimeDAO/prime-launch-dapp/commit/c85cb34762f80cfaaef20475cb9a1a31ebd011fd))
* **wizard.Seed:** take network name ([d9cfeb2](https://github.com/PrimeDAO/prime-launch-dapp/commit/d9cfeb2e90c32e276bd7e529da2fb9b200de5cd9))
* **wizard.seed:** typo ([dc32e7f](https://github.com/PrimeDAO/prime-launch-dapp/commit/dc32e7f114863f0c38f78009795ddf877ff000f0))
* **wizard.submit:** correct token address for etherscanlink ([fc5ad29](https://github.com/PrimeDAO/prime-launch-dapp/commit/fc5ad298e03179fce1da3e32fff2b65bd9f744d7))
* **wizard.submit:** correct token address for etherscanlink ([3ad282a](https://github.com/PrimeDAO/prime-launch-dapp/commit/3ad282a93bec69fbf7c817669abadee8efb04a05))
* **wizard.submit:** correct token address for etherscanlink ([9998450](https://github.com/PrimeDAO/prime-launch-dapp/commit/999845010348206527ef597f55f2add192ec4411))
* **wizard.summary:** funding decimals ([a03cb9c](https://github.com/PrimeDAO/prime-launch-dapp/commit/a03cb9cff4193c6cd74df27afd11c923b425b395))
* **wizard.token:** move copy to `bind()` hook (was showing as undefined) ([dfd34c8](https://github.com/PrimeDAO/prime-launch-dapp/commit/dfd34c8c30bcacc3875bc7f720dbe257ddaf5883))
* **wizard.Token:** take network name ([82d1867](https://github.com/PrimeDAO/prime-launch-dapp/commit/82d18674ca3b0077721aca8743d701bcf70ba1b8))
* **wizard.Token:** take network name ([39f87e6](https://github.com/PrimeDAO/prime-launch-dapp/commit/39f87e655305aa04530be429ba8fbb4b78f77b72))


### Features

* **adminDashboard:** clean up types for addClassBatch() ([aa161e3](https://github.com/PrimeDAO/prime-launch-dapp/commit/aa161e328d560267866196d46b6524de8b5764ec))
* **classes:** update class name, fetch first class ([db4fd31](https://github.com/PrimeDAO/prime-launch-dapp/commit/db4fd3174e3f362fa99de5f4703c6bf4beddfb0d))
* **elements:** add formattedDate component ([abfec69](https://github.com/PrimeDAO/prime-launch-dapp/commit/abfec69062db3d25757f2d1dc40d24c5f95ddfba))
* **elements:** add formattedDate component ([8ca7941](https://github.com/PrimeDAO/prime-launch-dapp/commit/8ca79413ca74086a02eecae7f0563abaf09005e1))
* **entities:** add type for Class from Contract and load into Seed ([709c3d1](https://github.com/PrimeDAO/prime-launch-dapp/commit/709c3d1162c6be4f20b27d1d482e1778e13ee220))
* **launches:** filter out launches base on criteria ([4e1b5ae](https://github.com/PrimeDAO/prime-launch-dapp/commit/4e1b5aed42cbe5016544f386f27e25c712421dbe))
* **launches:** fix seed project name ([7e1c92c](https://github.com/PrimeDAO/prime-launch-dapp/commit/7e1c92c0a260693d1031f94b26b5d9d94fce6de9))
* **launch:** update label for permission toggle ([8bf3be1](https://github.com/PrimeDAO/prime-launch-dapp/commit/8bf3be1cb8b1ef5cbbc8e3ee815254125d322460))
* **seed.config:** add `isPermissioned` prop ([909440c](https://github.com/PrimeDAO/prime-launch-dapp/commit/909440cd0acbfe5b47ed82a2659439af02b2ac54))
* **seed.config:** add `seedTip` prop ([33ba436](https://github.com/PrimeDAO/prime-launch-dapp/commit/33ba4366b4884c4c14b245055bf7669a507caa58))
* **seed:** add individualCap ([58b45d6](https://github.com/PrimeDAO/prime-launch-dapp/commit/58b45d6ee1634d7a597a5a880865f078a2fce952))
* **seedDashboard:** add class sold ([4aac888](https://github.com/PrimeDAO/prime-launch-dapp/commit/4aac888f91f46498ad466fb30e60eaf58b9249a6))
* **seedDashboard:** add class sold ([b2df466](https://github.com/PrimeDAO/prime-launch-dapp/commit/b2df4668021fd6205c798f69aa604bddd3c49748))
* **seedDashboard:** enhance dates with new formattedDate component (now, have tooltip) ([66ff07a](https://github.com/PrimeDAO/prime-launch-dapp/commit/66ff07ac64fe7b3458976d00ed67a8be36beef11))
* **seedDashboard:** enhance dates with new formattedDate component (now, have tooltip) ([b4941c2](https://github.com/PrimeDAO/prime-launch-dapp/commit/b4941c24112da53ba71fe13696d4b219b6708a77))
* **seedDashboard:** enhance dates with new formattedDate component (now, have tooltip) ([3dc2d7b](https://github.com/PrimeDAO/prime-launch-dapp/commit/3dc2d7b3cbe1bb43d943cf29f26903810d0e1d49))
* **seedDashboard:** get the correct user class ([a069aa6](https://github.com/PrimeDAO/prime-launch-dapp/commit/a069aa6c3fda716657a94f5c583254517233a27a))
* **seedDashboard:** get the correct user class ([3b7559c](https://github.com/PrimeDAO/prime-launch-dapp/commit/3b7559c8429e217ba2a0397f04f28526bb0eaebe))
* **seedDashboard:** load defaultClass ([63b9ab6](https://github.com/PrimeDAO/prime-launch-dapp/commit/63b9ab6f49015ddc4ca1a1f19939ac3162126cf8))
* **seedDashboard:** make amount raised reactive ([3992ad6](https://github.com/PrimeDAO/prime-launch-dapp/commit/3992ad6d72aac240e747c800ce2d8eb59aac67c3))
* **seedDashboard:** make amount raised reactive ([eee4f15](https://github.com/PrimeDAO/prime-launch-dapp/commit/eee4f15bac52e4da4333c3dca0505b5c23133565))
* **seedDashboard:** remove "$" from caps ([3ad3437](https://github.com/PrimeDAO/prime-launch-dapp/commit/3ad343769cfdebf907d1cf982372c3de97c8110e))
* **seedDashboard:** remove "$" from caps ([9f6a46c](https://github.com/PrimeDAO/prime-launch-dapp/commit/9f6a46cb5d0c3d6f73c989a09ec91c0f5c7edd20))
* **seedDashboard:** remove "Class price" and add Class name ([c218529](https://github.com/PrimeDAO/prime-launch-dapp/commit/c21852928ce24ed48a34c7ea75d066d418f3c287))
* **seedDashboard:** remove "Class price" and add Class name ([4e967d0](https://github.com/PrimeDAO/prime-launch-dapp/commit/4e967d02e9f83e8abd3076ce2b72b04a6ab48c3e))
* **seedDashboard:** remove verified "Verified by Prime Rating" ([f8748ff](https://github.com/PrimeDAO/prime-launch-dapp/commit/f8748ff6627ce335176b187e4142417c0e5ea904))
* **seedDashboard:** remove verified "Verified by Prime Rating" ([5ab57d4](https://github.com/PrimeDAO/prime-launch-dapp/commit/5ab57d459a878d34353165585bbfe953b5c2a43a))
* **seedDashboard:** update class cap ([b493898](https://github.com/PrimeDAO/prime-launch-dapp/commit/b4938985b49d1a4f383d20f47043ef1dd1615a40))
* **seedDashboard:** update class cap ([bd2cec5](https://github.com/PrimeDAO/prime-launch-dapp/commit/bd2cec501791264c50313a604505643b37d19c5f))
* **seedDashboard:** update cliff and vesting ([eb64aac](https://github.com/PrimeDAO/prime-launch-dapp/commit/eb64aac104b64f1c1e988255b78c6dd43a3cbfc5))
* **seedDashboard:** update cliff and vesting ([89b3880](https://github.com/PrimeDAO/prime-launch-dapp/commit/89b38800e25919070f3db713eb6e863f8506cb9c))
* **seedDashboard:** update max input ([7c517ea](https://github.com/PrimeDAO/prime-launch-dapp/commit/7c517eae08a8997bf0b4d929e154cfaa5da07bf6))
* **seedDashboard:** update max input ([608bf68](https://github.com/PrimeDAO/prime-launch-dapp/commit/608bf6839a496b537c869f39315567a33fa6662d))
* **seedDashboard:** update time left (resp. starts in) ([6047572](https://github.com/PrimeDAO/prime-launch-dapp/commit/60475720416befdbc7c8e125a18e9e51a16779dd))
* **seedDashboard:** update time left (resp. starts in) ([869db04](https://github.com/PrimeDAO/prime-launch-dapp/commit/869db047c0484f64c186e373957a4f643dcded8f))
* **seed:** reactively update user balance ([9065fd1](https://github.com/PrimeDAO/prime-launch-dapp/commit/9065fd156bc9f46314e9ff6347c4c053e24c23f9))
* **seed:** reactively update user balance ([6f3a9d5](https://github.com/PrimeDAO/prime-launch-dapp/commit/6f3a9d53b7c934965e43d635067288a38e937cba))
* **services.date:** add "< 1 day" case ([b1274f0](https://github.com/PrimeDAO/prime-launch-dapp/commit/b1274f09693682158625aafba63089fe1e9085bb))
* **services.date:** add "< 1 day" case ([9267757](https://github.com/PrimeDAO/prime-launch-dapp/commit/92677577b605df1ca28681fd1f55ba68099702d0))
* **services:** add `metadata` to launchTypes ([9a363da](https://github.com/PrimeDAO/prime-launch-dapp/commit/9a363da851cbda293eb9f0c3458f4ce1dcd95218))
* **services:** add min to BigNumber ([7665715](https://github.com/PrimeDAO/prime-launch-dapp/commit/76657159315eefbbe73811eb22208b1213a33961))
* **services:** add min to BigNumber ([1c04f34](https://github.com/PrimeDAO/prime-launch-dapp/commit/1c04f34506389996c90d1f64528f1afe4c6cac1d))
* **services:** capitalizeNetwork function ([e3e9a91](https://github.com/PrimeDAO/prime-launch-dapp/commit/e3e9a9108fc87cb60ab8258d52d13bb4d347308a))
* **services:** capitalizeNetwork function ([28877bb](https://github.com/PrimeDAO/prime-launch-dapp/commit/28877bbc7bf8b942a6fb83ff7df472f74324d5a6))
* **services:** fix min calc ([b53646f](https://github.com/PrimeDAO/prime-launch-dapp/commit/b53646f1e480099eb3ad5526c521cd2298913b62))
* **services:** remove old addClass call ([98515fd](https://github.com/PrimeDAO/prime-launch-dapp/commit/98515fdb07c07dc793792936cb86c70c11090dea))
* **services:** TxService, add console log. Reason: was hard to know where error came from ([fc78ab0](https://github.com/PrimeDAO/prime-launch-dapp/commit/fc78ab0f3e28e1b9e9daca5351d9364a2ac0ef33))
* **services:** update deployCall ([ab9288c](https://github.com/PrimeDAO/prime-launch-dapp/commit/ab9288cbbee075d9ae087459f6496a8dbdc7858e))
* **services:** update deployCall part 2 ([ecb2922](https://github.com/PrimeDAO/prime-launch-dapp/commit/ecb29227d346d0ad9dd3627ad911c50e1480ebfd))
* **services:** update isPermissioned prop ([779712e](https://github.com/PrimeDAO/prime-launch-dapp/commit/779712e87cf3f353d367fe86c332bc0e48a22cd9))
* **services:** update where tip is taken from ([c2ad9c9](https://github.com/PrimeDAO/prime-launch-dapp/commit/c2ad9c94e300520098517dc620c1e7fe07955e0a))
* **wizard.seed.thankyou:** open admin dashboard in new tab ([c138005](https://github.com/PrimeDAO/prime-launch-dapp/commit/c1380052367218a6c60b063ed3699f5d8191a365))
* **wizard.seed.thankyou:** open admin dashboard in new tab ([9cb0e7c](https://github.com/PrimeDAO/prime-launch-dapp/commit/9cb0e7c07293026098b74fd1deff591b21839c52))
* **wizard.seed.thankyou:** open admin dashboard in new tab ([eff97b2](https://github.com/PrimeDAO/prime-launch-dapp/commit/eff97b20b687cf6d16f2ff99e1d6060eb6a6ae20))
* **wizard.seed:** copy update ([e357830](https://github.com/PrimeDAO/prime-launch-dapp/commit/e3578305a3e1ab375a92d0548b7f99594a51534d)), closes [#753](https://github.com/PrimeDAO/prime-launch-dapp/issues/753)
* **wizard.seed:** copy update ([c4a7ed0](https://github.com/PrimeDAO/prime-launch-dapp/commit/c4a7ed02f5e99cc5c47aa24cfd038ac82c45107d)), closes [#753](https://github.com/PrimeDAO/prime-launch-dapp/issues/753)
* **wizard.seedDetails:** add permissionedToggle ([c8809e6](https://github.com/PrimeDAO/prime-launch-dapp/commit/c8809e6678899aeb12c3b3fb2f8de5146cc93cb8))
* **wizard.seedDetails:** add tipping ([a32ae2b](https://github.com/PrimeDAO/prime-launch-dapp/commit/a32ae2b71f872d0f5ea47cb7a0a93c5e8189e37c))
* **wizard.seed:** handle allowList ([9279ef0](https://github.com/PrimeDAO/prime-launch-dapp/commit/9279ef0ba49b48d5c6492471eb74cbba3d11da26))
* **wizard.seed:** init start/end date ([a779702](https://github.com/PrimeDAO/prime-launch-dapp/commit/a7797020dcfee96675b8cb05aa7462eeee89e270))
* **wizard.summary:** add permissoned toggle ([411c1c6](https://github.com/PrimeDAO/prime-launch-dapp/commit/411c1c6024836551c0aa08570b69e754e020f2b0))
* **wizard.summary:** take tipping from object ([0a1a204](https://github.com/PrimeDAO/prime-launch-dapp/commit/0a1a204ee0e58118bb78f7bb2c531bd1b61e9288))


### Performance Improvements

* **EthBalance:** don't call getBalance, reason: not used ([8de6316](https://github.com/PrimeDAO/prime-launch-dapp/commit/8de6316903b1e637ad6a899cc7203c74d074f74f))
* remove call to getBlock (reason: not used) ([0b85797](https://github.com/PrimeDAO/prime-launch-dapp/commit/0b85797b9259c71eea74d812eccce00bbaf110d2))
* remove call to getBlock (reason: not used) ([a80b086](https://github.com/PrimeDAO/prime-launch-dapp/commit/a80b0864e9ed583c9d3f7dbfeac6f8a1c8dda918))
* **seedDashboard:** adjust way to get new blocks ([f95ab56](https://github.com/PrimeDAO/prime-launch-dapp/commit/f95ab56cf26c072a1eb8d1b756d2e4ff40dc1c72))
* **seedDashboard:** adjust way to get new blocks ([208d1c1](https://github.com/PrimeDAO/prime-launch-dapp/commit/208d1c191fe6cab972ac6ca617fa65cac249b05a))


### Reverts

* Revert "added loading icon when minting (edit / add)" ([0e714ae](https://github.com/PrimeDAO/prime-launch-dapp/commit/0e714ae95c22ca0e855f6c32eb1a056fc851fd48))
* Revert "save" ([35ed796](https://github.com/PrimeDAO/prime-launch-dapp/commit/35ed796deadaa7d739866a87cb4cc632e0cc662f))
* Revert "revert formatting" ([efaa94f](https://github.com/PrimeDAO/prime-launch-dapp/commit/efaa94fc4902569744c719ee5ed3ae7a439d9205))
* Revert "add mobile style" - only package-lock.json change ([ffd5178](https://github.com/PrimeDAO/prime-launch-dapp/commit/ffd517896a4cf81149fba1d202a8c38505afac3e))
* Revert "updated sor2 into sor" ([e6dda5f](https://github.com/PrimeDAO/prime-launch-dapp/commit/e6dda5f166efffbda4da8adc7bd9ffa7ad0e3ece))
* Revert "perf(EthBalance): don't call getBalance, reason: not used" ([d3da55e](https://github.com/PrimeDAO/prime-launch-dapp/commit/d3da55eb6738665734393c258db40de55ca1f711))
* Revert "lint fix" ([d44a829](https://github.com/PrimeDAO/prime-launch-dapp/commit/d44a82954d0bf1e171f6caebd2be4dab83522f09))



## [1.0.1-alpha.1](https://github.com/PrimeDAO/prime-launch-dapp/compare/v1.0.0...v1.0.1-alpha.1) (2022-10-12)


### Bug Fixes

* add commas to numerical fields ([#580](https://github.com/PrimeDAO/prime-launch-dapp/issues/580)) ([f20b6ef](https://github.com/PrimeDAO/prime-launch-dapp/commit/f20b6ef6033ae5c58425664f6521286d02ebab08))
* add https in the website plaeholders ([#561](https://github.com/PrimeDAO/prime-launch-dapp/issues/561)) ([9414764](https://github.com/PrimeDAO/prime-launch-dapp/commit/9414764b4e28f51ef469ed163b847f956bbdc989))
* add N/A at whitelist if no whitelist ([#530](https://github.com/PrimeDAO/prime-launch-dapp/issues/530)) ([b252efe](https://github.com/PrimeDAO/prime-launch-dapp/commit/b252efed81e25b04a3c88f04a4032ce5d7acf1ef))
* change error message of lpb number of tokens ([#374](https://github.com/PrimeDAO/prime-launch-dapp/issues/374)) ([05e5ef2](https://github.com/PrimeDAO/prime-launch-dapp/commit/05e5ef289cb9a13ddaa21f1bb2951bf85614b0b8))
* change ethereum button color ([#541](https://github.com/PrimeDAO/prime-launch-dapp/issues/541)) ([da21fa0](https://github.com/PrimeDAO/prime-launch-dapp/commit/da21fa0f931f4fa37480dd1affd55005ae1f6fb6))
* change fair launch image and add border radius to it ([#422](https://github.com/PrimeDAO/prime-launch-dapp/issues/422)) ([5e80b43](https://github.com/PrimeDAO/prime-launch-dapp/commit/5e80b43afcd94648502ecfe348b6cebef0a8b9b5))
* change launch page subtitle ([#526](https://github.com/PrimeDAO/prime-launch-dapp/issues/526)) ([c56f56f](https://github.com/PrimeDAO/prime-launch-dapp/commit/c56f56f327e287c68eb4ccc53d082d895cb9ba6d))
* change link of request information of seed and lbp ([#532](https://github.com/PrimeDAO/prime-launch-dapp/issues/532)) ([8e16422](https://github.com/PrimeDAO/prime-launch-dapp/commit/8e164224e8fa8697b9f8a8df2868803bece2ed73))
* change submenu order ([#531](https://github.com/PrimeDAO/prime-launch-dapp/issues/531)) ([9ebb831](https://github.com/PrimeDAO/prime-launch-dapp/commit/9ebb831283186b8f349d71377b87cd665f05a57b))
* change text in apply for launch ([#524](https://github.com/PrimeDAO/prime-launch-dapp/issues/524)) ([74bceea](https://github.com/PrimeDAO/prime-launch-dapp/commit/74bceeaa6edf5091ab0768896fbae3d941b16c6d))
* change title to Seamlessly kickstart your DAO ([#523](https://github.com/PrimeDAO/prime-launch-dapp/issues/523)) ([f8851ed](https://github.com/PrimeDAO/prime-launch-dapp/commit/f8851ed1d97b01806d5141fd180dfb87c3bf40f6))
* change view all launches to view all ([#525](https://github.com/PrimeDAO/prime-launch-dapp/issues/525)) ([c89a034](https://github.com/PrimeDAO/prime-launch-dapp/commit/c89a034b31259f4d1ef1226fad0266f813280cb2))
* cliff and vest should be able to be 0 ([#543](https://github.com/PrimeDAO/prime-launch-dapp/issues/543)) ([c9423eb](https://github.com/PrimeDAO/prime-launch-dapp/commit/c9423eb6a25d510f312a06d93ac905a7ffe0791b))
* fix button redirection ([#571](https://github.com/PrimeDAO/prime-launch-dapp/issues/571)) ([e74c416](https://github.com/PrimeDAO/prime-launch-dapp/commit/e74c4164d64a37d6352a5dbafa3208993b8c6a36))
* fix invalid bignumber value when submitting a new seed ([#455](https://github.com/PrimeDAO/prime-launch-dapp/issues/455)) ([aee99db](https://github.com/PrimeDAO/prime-launch-dapp/commit/aee99db960daca366ba70bb4cd7fb7d8c7f9dfe1))
* fix request information ([#400](https://github.com/PrimeDAO/prime-launch-dapp/issues/400)) ([85a89ee](https://github.com/PrimeDAO/prime-launch-dapp/commit/85a89ee5a2176a25931ddb8a2fc7f46130cee751))
* fix spinner not showing ([#598](https://github.com/PrimeDAO/prime-launch-dapp/issues/598)) ([818c4bc](https://github.com/PrimeDAO/prime-launch-dapp/commit/818c4bc71a51a726fece04310add24018175344b))
* fix weights feedback spacing ([#432](https://github.com/PrimeDAO/prime-launch-dapp/issues/432)) ([a1ac311](https://github.com/PrimeDAO/prime-launch-dapp/commit/a1ac31148e133336e676fc8cea2179cb0970679e))
* modify tooltips and add a new one ([#606](https://github.com/PrimeDAO/prime-launch-dapp/issues/606)) ([66889b8](https://github.com/PrimeDAO/prime-launch-dapp/commit/66889b874221780cd0d2bc7265efd10b3fdd709e))
* remplace launch by register ([#542](https://github.com/PrimeDAO/prime-launch-dapp/issues/542)) ([c2b8224](https://github.com/PrimeDAO/prime-launch-dapp/commit/c2b82244fe4efa46539efa7874541e149cdaca05))
* replace primelaunch by prime launch ([#528](https://github.com/PrimeDAO/prime-launch-dapp/issues/528)) ([ab31f5d](https://github.com/PrimeDAO/prime-launch-dapp/commit/ab31f5d3087a96a9cda1a25e34a2f85af84c459a))
* **seedDashboard:** allow "gte", because exact amount should also be possible ([6bd46c1](https://github.com/PrimeDAO/prime-launch-dapp/commit/6bd46c100e1d43f2ec6cdedfe76c47ecaf73d7a8))
* **seedDashboard:** this.seed undefined ([52dcf09](https://github.com/PrimeDAO/prime-launch-dapp/commit/52dcf0957439faa496e244a82a26e6155695db5c))
* submenu should always be visible ([#529](https://github.com/PrimeDAO/prime-launch-dapp/issues/529)) ([b2c88d2](https://github.com/PrimeDAO/prime-launch-dapp/commit/b2c88d221c1554927fbafbb7bcefb41734f3a7be))
* token ratio need adjustments ([#415](https://github.com/PrimeDAO/prime-launch-dapp/issues/415)) ([3fca93c](https://github.com/PrimeDAO/prime-launch-dapp/commit/3fca93ca0333d7de02a30cde4afaa7202d43aab1))
* update url of request information ([#615](https://github.com/PrimeDAO/prime-launch-dapp/issues/615)) ([e500750](https://github.com/PrimeDAO/prime-launch-dapp/commit/e5007505de477409db62547bdb1e36a53df82e11))
* **wizard.Seed:** take network name ([c85cb34](https://github.com/PrimeDAO/prime-launch-dapp/commit/c85cb34762f80cfaaef20475cb9a1a31ebd011fd))
* **wizard.submit:** correct token address for etherscanlink ([fc5ad29](https://github.com/PrimeDAO/prime-launch-dapp/commit/fc5ad298e03179fce1da3e32fff2b65bd9f744d7))
* **wizard.submit:** correct token address for etherscanlink ([3ad282a](https://github.com/PrimeDAO/prime-launch-dapp/commit/3ad282a93bec69fbf7c817669abadee8efb04a05))
* **wizard.Token:** take network name ([82d1867](https://github.com/PrimeDAO/prime-launch-dapp/commit/82d18674ca3b0077721aca8743d701bcf70ba1b8))


### Features

* added icons over time remaining dashboard ([#454](https://github.com/PrimeDAO/prime-launch-dapp/issues/454)) ([ecb9a28](https://github.com/PrimeDAO/prime-launch-dapp/commit/ecb9a286ac851b757c4499b8bb94d2462df2120c))
* display link to the launch in the launch admin page ([#447](https://github.com/PrimeDAO/prime-launch-dapp/issues/447)) ([7c24459](https://github.com/PrimeDAO/prime-launch-dapp/commit/7c24459ff86a825789a4df1ac35a8ecad344475b))
* **elements:** add formattedDate component ([abfec69](https://github.com/PrimeDAO/prime-launch-dapp/commit/abfec69062db3d25757f2d1dc40d24c5f95ddfba))
* **lbp:** largest -> largest2 ([#705](https://github.com/PrimeDAO/prime-launch-dapp/issues/705)) ([1f8f223](https://github.com/PrimeDAO/prime-launch-dapp/commit/1f8f22357d209d6c4d534c3990ab4a2a07c75068))
* **seedDashboard:** enhance dates with new formattedDate component (now, have tooltip) ([66ff07a](https://github.com/PrimeDAO/prime-launch-dapp/commit/66ff07ac64fe7b3458976d00ed67a8be36beef11))
* **seedDashboard:** make amount raised reactive ([3992ad6](https://github.com/PrimeDAO/prime-launch-dapp/commit/3992ad6d72aac240e747c800ce2d8eb59aac67c3))
* **seed:** reactively update user balance ([9065fd1](https://github.com/PrimeDAO/prime-launch-dapp/commit/9065fd156bc9f46314e9ff6347c4c053e24c23f9))
* **services.date:** add "< 1 day" case ([b1274f0](https://github.com/PrimeDAO/prime-launch-dapp/commit/b1274f09693682158625aafba63089fe1e9085bb))
* **services:** capitalizeNetwork function ([e3e9a91](https://github.com/PrimeDAO/prime-launch-dapp/commit/e3e9a9108fc87cb60ab8258d52d13bb4d347308a))
* **wizard.seed.thankyou:** open admin dashboard in new tab ([c138005](https://github.com/PrimeDAO/prime-launch-dapp/commit/c1380052367218a6c60b063ed3699f5d8191a365))
* **wizard.seed.thankyou:** open admin dashboard in new tab ([9cb0e7c](https://github.com/PrimeDAO/prime-launch-dapp/commit/9cb0e7c07293026098b74fd1deff591b21839c52))
* **wizard.seed:** copy update ([e357830](https://github.com/PrimeDAO/prime-launch-dapp/commit/e3578305a3e1ab375a92d0548b7f99594a51534d)), closes [#753](https://github.com/PrimeDAO/prime-launch-dapp/issues/753)


### Performance Improvements

* remove call to getBlock (reason: not used) ([0b85797](https://github.com/PrimeDAO/prime-launch-dapp/commit/0b85797b9259c71eea74d812eccce00bbaf110d2))
* **seedDashboard:** adjust way to get new blocks ([f95ab56](https://github.com/PrimeDAO/prime-launch-dapp/commit/f95ab56cf26c072a1eb8d1b756d2e4ff40dc1c72))


### Reverts

* Revert "save" ([35ed796](https://github.com/PrimeDAO/prime-launch-dapp/commit/35ed796deadaa7d739866a87cb4cc632e0cc662f))
* Revert "lint fix" ([d44a829](https://github.com/PrimeDAO/prime-launch-dapp/commit/d44a82954d0bf1e171f6caebd2be4dab83522f09))
* Revert "Removed unnecessary margin from button (#279)" (#301) ([365edf1](https://github.com/PrimeDAO/prime-launch-dapp/commit/365edf1590a1e3cadf2864e945ae0f30d7855933)), closes [#279](https://github.com/PrimeDAO/prime-launch-dapp/issues/279) [#301](https://github.com/PrimeDAO/prime-launch-dapp/issues/301)
* Revert "fix docs link" ([45f246a](https://github.com/PrimeDAO/prime-launch-dapp/commit/45f246aca82c9d4dc88d98a03e9cf43fc5b9eb70))



