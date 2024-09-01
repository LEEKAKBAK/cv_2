import { weaponCards } from './weapon.js';

export class CardEvent {
    constructor(scene) {
        this.scene = scene;
        this.upgradeCards = [
            { text: '무기 데미지 20% 증가', effect: 'increaseDamage' },
            { text: '무기 공속 20% 증가', effect: 'increaseFireRate' },
            { text: '크리확률 20% 증가', effect: 'increaseCriticalChance' },
            { text: '무기 속도 20% 증가', effect: 'increaseWeaponSpeed' },
            { text: '크리배율 20% 증가', effect: 'increaseCriticalRate' }
        ];
        this.selectedCardIndex = 0;
        this.keyboardEnabled = true;

        // 키보드 입력을 위한 이벤트 핸들러 바인딩
        this.handleKeyDown = this.handleKeyDown.bind(this);
    }

    triggerUpgradeCardSelection(upgradeType) {
        this.selectedCardIndex = 0;
        this.keyboardEnabled = true;

        // upgradeCardTexts 초기화
        if (this.scene.upgradeCardTexts) {
            this.scene.upgradeCardTexts.forEach(text => text.destroy());
        }
        this.scene.upgradeCardTexts = [];

        this.scene.physics.pause();
        this.scene.isPaused = true; // 게임 일시 중지

        let selectedCards;
        // 무기와 업그레이드를 랜덤하게 섞어서 선택
        const availableWeaponCards = weaponCards.filter(weaponCard => 
            !this.scene.hero.weapons.some(weapon => weapon.name === weaponCard.name)
        );

        // 현재 무기 개수 확인
        const currentWeaponCount = this.scene.hero.weapons.length;

        if (currentWeaponCount >= 3) {
            // 무기가 3개 이상인 경우 업그레이드 카드만 선택
            selectedCards = Phaser.Utils.Array.Shuffle(this.upgradeCards).slice(0, 3);
        } else if (upgradeType === 'weaponOnly') {
            selectedCards = Phaser.Utils.Array.Shuffle(availableWeaponCards).slice(0, 3);
        } else {
            const allCards = [...this.upgradeCards, ...availableWeaponCards];
            selectedCards = Phaser.Utils.Array.Shuffle(allCards).slice(0, 3);
        }

        // UI 생성
        // this.scene.upgradeCardTexts = selectedCards.map((card, index) => {
        //     const fireRatePerSecond = (1000 / card.fireRate).toFixed(1); // 초당 발사 수 계산
        //     const text = this.scene.add.text(this.scene.scale.width / 2, this.scene.scale.height / 2 + index * 60, card.text || `${card.name} (데미지: ${card.damage}, 공속: ${fireRatePerSecond}발/초, 크리확률: ${card.criticalChance}, 크리배율: ${card.criticalRate})`, {
        //         fontSize: '24px',
        //         fill: '#000',
        //         backgroundColor: '#ffffff',
        //         padding: { x: 10, y: 20 } // 세로 길이 늘리기
        //     }).setOrigin(0.5);
        //     text.setInteractive();
        //     text.on('pointerdown', () => {
        //         this.applyUpgrade(card.effect || card);
        //     });
        //     return text;
        // });
        this.scene.upgradeCardTexts = selectedCards.map((card, index) => {
            const cardWidth = 400; // 카드의 너비
            const cardHeight = 200; // 카드의 높이 (2:1 비율)
            const padding = 10;
            const fireRatePerSecond = (1000 / card.fireRate).toFixed(1);
            
            const cardBackground = this.scene.add.rectangle(
                this.scene.scale.width / 2,
                this.scene.scale.height / 2 + index * (cardHeight + 20),
                cardWidth,
                cardHeight,
                0xffffff
            ).setOrigin(0.5);
    
            const content = card.text || 
                `${card.name}\n데미지: ${card.damage}\n공속: ${fireRatePerSecond}발/초\n크리확률: ${card.criticalChance}\n크리배율: ${card.criticalRate}`;
    
            const text = this.scene.add.text(
                cardBackground.x - cardWidth / 2 + padding,
                cardBackground.y - cardHeight / 2 + padding,
                content,
                {
                    fontSize: '18px',
                    fill: '#000',
                    wordWrap: { width: cardWidth - padding * 2, useAdvancedWrap: true }
                }
            );
    
            const container = this.scene.add.container(0, 0, [cardBackground, text]);
            container.setInteractive(new Phaser.Geom.Rectangle(
                cardBackground.x - cardWidth / 2,
                cardBackground.y - cardHeight / 2,
                cardWidth,
                cardHeight
            ), Phaser.Geom.Rectangle.Contains);
    
            container.on('pointerdown', () => {
                this.applyUpgrade(card.effect || card);
            });

            container.cardData = card; // 카드 데이터 저장
    
            return container;
        });

        this.updateCardSelection();

        // 기존 키보드 이벤트 리스너 제거
        this.scene.input.keyboard.off('keydown', this.handleKeyDown);

        // 키보드 입력 설정
        this.scene.input.keyboard.on('keydown', this.handleKeyDown);
    }

    handleKeyDown(event) {
        switch (event.code) {
            case 'ArrowUp':
                this.moveSelectionUp();
                break;
            case 'ArrowDown':
                this.moveSelectionDown();
                break;
            case 'Space':
                this.confirmSelection();
                break;
            case 'Digit1':
                this.applyUpgrade(this.scene.upgradeCardTexts[0]?.effect || this.scene.upgradeCardTexts[0]?.name);
                break;
            case 'Digit2':
                this.applyUpgrade(this.scene.upgradeCardTexts[1]?.effect || this.scene.upgradeCardTexts[1]?.name);
                break;
            case 'Digit3':
                this.applyUpgrade(this.scene.upgradeCardTexts[2]?.effect || this.scene.upgradeCardTexts[2]?.name);
                break;
        }
    }

    moveSelectionUp() {
        if (this.keyboardEnabled) {
            this.selectedCardIndex = (this.selectedCardIndex - 1 + this.scene.upgradeCardTexts.length) % this.scene.upgradeCardTexts.length;
            this.updateCardSelection();
        }
    }

    moveSelectionDown() {
        if (this.keyboardEnabled) {
            this.selectedCardIndex = (this.selectedCardIndex + 1) % this.scene.upgradeCardTexts.length;
            this.updateCardSelection();
        }
    }

    confirmSelection() {
        if (this.keyboardEnabled) {
            const selectedCard = this.scene.upgradeCardTexts[this.selectedCardIndex];
            const upgradeCard = this.upgradeCards.find(card => card.text === selectedCard.text);
            
            if (upgradeCard) {
                // 업그레이드 카드인 경우
                this.applyUpgrade(upgradeCard.effect);
            } else {
                // 무기 카드인 경우
                const weaponCard = weaponCards.find(card => `${card.name} (데미지: ${card.damage}, 공속: ${(1000 / card.fireRate).toFixed(1)}발/초, 크리확률: ${card.criticalChance}, 크리배율: ${card.criticalRate})` === selectedCard.text);
                if (weaponCard) {
                    this.applyUpgrade(weaponCard);
                }
            }
        }
    }

    // updateCardSelection() {
    //     if (this.scene.upgradeCardTexts) {
    //         this.scene.upgradeCardTexts.forEach((text, index) => {
    //             if (text) { // text가 유효한지 확인
    //                 if (index === this.selectedCardIndex) {
    //                     text.setStyle({ backgroundColor: '#ff0' }); // 선택된 카드의 테두리 색상 변경
    //                 } else {
    //                     text.setStyle({ backgroundColor: '#ffffff' });
    //                 }
    //             }
    //         });
    //     }
    // }
    updateCardSelection() {
        this.scene.upgradeCardTexts.forEach((container, index) => {
            if (index === this.selectedCardIndex) {
                container.list[0].setStrokeStyle(4, 0x0000ff); // 배경 사각형에 테두리 추가
                container.list[1].setColor('#0000ff'); // 텍스트 색상 변경
            } else {
                container.list[0].setStrokeStyle(0); // 테두리 제거
                container.list[1].setColor('#000000'); // 텍스트 색상 원래대로
            }
        });
    }

    applyUpgrade(effect) {
        this.keyboardEnabled = false; // 키보드 입력 비활성화
        // 강화카드 효과 적용
        if (typeof effect === 'string') {
            switch (effect) {
                case 'increaseDamage':
                    this.scene.hero.weapons.forEach(weapon => weapon.damage *= 1.2);
                    break;
                case 'increaseFireRate':
                    this.scene.hero.weapons.forEach(weapon => weapon.fireRate /= 1.2);
                    break;
                case 'increaseCriticalChance':
                    this.scene.hero.weapons.forEach(weapon => weapon.criticalChance *= 1.2);
                    break;
                case 'increaseSpeed':
                    this.scene.hero.speed *= 1.2;
                    break;
                case 'increaseCriticalRate':
                    this.scene.hero.weapons.forEach(weapon => weapon.criticalRate *= 1.2);
                    break;
            }
        } else {
            // 새로운 무기 추가
            this.scene.hero.weapons.push(effect);
        }
    
        // UI 제거
        if (this.scene.upgradeCardTexts) {
            this.scene.upgradeCardTexts.forEach(text => text.destroy());
        }
    
        // 1초 대기 후 게임 재개
        this.scene.time.delayedCall(500, () => {
            this.scene.physics.resume();
            this.scene.isPaused = false;
        }, [], this);
    }
    
}
