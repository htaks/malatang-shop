const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 500,
  backgroundColor: '#f5e6d0',
  scene: { preload, create }
}

const game = new Phaser.Game(config)

let customer, idleTween, walkTween

function preload() {
  this.load.image('customer1', 'assets/sprites/customer1.png')
}

function create() {
  const scene = this

  customer = scene.add.image(400, 300, 'customer1')
  customer.setOrigin(0.5, 1)
  customer.setScale(0.8)
  customer.setInteractive()

  // idle tween (default)
  idleTween = scene.tweens.add({
    targets: customer,
    y: 295,
    duration: 1200,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut'
  })

  // click: shrink
  customer.on('pointerdown', () => {
    scene.tweens.add({
      targets: customer,
      scaleX: Math.sign(customer.scaleX) * 0.6,
      scaleY: 0.6,
      duration: 300,
      ease: 'Power2',
      yoyo: true
    })
  })

  // UI buttons
  makeButton(scene, 60, 30, '歩く', () => {
    stopAllTweens(scene)
    walkTween = scene.tweens.add({
      targets: customer,
      x: 600,
      duration: 3000,
      yoyo: true,
      repeat: -1,
      ease: 'Linear',
      onUpdate: () => {
        const moving = scene.tweens.getTweensOf(customer).find(t => t === walkTween)
        if (!moving) return
        // flip based on movement direction
        const progress = walkTween.progress
        const flipped = walkTween.isYoyo() || (walkTween.totalProgress > 0.5)
        customer.scaleX = flipped ? -0.8 : 0.8
      }
    })
    walkTween.on('yoyo', () => { customer.scaleX = -0.8 })
    walkTween.on('repeat', () => { customer.scaleX = 0.8 })
  })

  makeButton(scene, 160, 30, '待機', () => {
    stopAllTweens(scene)
    customer.x = customer.x  // keep position
    idleTween = scene.tweens.add({
      targets: customer,
      y: customer.y - 5,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    })
  })

  makeButton(scene, 260, 30, 'リセット', () => {
    stopAllTweens(scene)
    customer.setPosition(400, 300)
    customer.setScale(0.8)
    idleTween = scene.tweens.add({
      targets: customer,
      y: 295,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    })
  })
}

function makeButton(scene, x, y, label, onClick) {
  const btn = scene.add.text(x, y, label, {
    fontSize: '18px',
    backgroundColor: '#4a2c1a',
    color: '#fff',
    padding: { x: 12, y: 6 }
  }).setInteractive()
  btn.on('pointerdown', onClick)
  btn.on('pointerover', () => btn.setStyle({ backgroundColor: '#7a4c2a' }))
  btn.on('pointerout', () => btn.setStyle({ backgroundColor: '#4a2c1a' }))
}

function stopAllTweens(scene) {
  scene.tweens.killTweensOf(customer)
  idleTween = null
  walkTween = null
}
