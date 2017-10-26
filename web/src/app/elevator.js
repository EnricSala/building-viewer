import TWEEN from 'tween.js';

const SPEED = 0.003;
const MIN_DELAY = 10000;
const MAX_DELAY = 15000;

class Elevator {

  constructor(part, floors) {
    this.elevator = part;
    this.floors = floors;
    this.current = floors.filter(it => it.floor == 4).pop()
  }

  animate() {
    const next = this.nextFloor();
    const distance = this.calcDistanceTo(next)
    const duration = Math.abs(distance) / SPEED;
    const delay = this.nextDelay();
    this.current = next;

    console.log(`next: ${next.floor}, distance: ${distance}, duration: ${duration}, delay: ${delay}`);

    const travel = new TWEEN.Tween(this.elevator.position)
      .to({ z: next.z }, duration)
      .easing(TWEEN.Easing.Quadratic.InOut)
      .onComplete(() => this.scheduleNext(delay))
      .start();
  }

  scheduleNext(delay) {
    setTimeout(() => { this.animate() }, delay);
  }

  nextFloor() {
    return this.floors[Math.floor(Math.random() * this.floors.length)]
  }

  nextDelay() {
    return Math.random() * (MAX_DELAY - MIN_DELAY) + MIN_DELAY;
  }

  calcDistanceTo(destination) {
    return destination.z - this.current.z
  }

}

export default Elevator;
