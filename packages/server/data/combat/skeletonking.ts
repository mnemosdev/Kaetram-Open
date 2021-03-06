import _ from 'lodash';
import Combat from '../../src/game/entity/character/combat/combat';
import Character from '../../src/game/entity/character/character';
import Mob from '../../src/game/entity/character/mob/mob';
import Utils from '../../src/util/utils';

class SkeletonKing extends Combat {
    /**
     * First of its kind, the Skeleton King will spawn 4 minions.
     * Two sorcerers on (x + 1, y + 1) & (x - 1, y + 1)
     *
     * And two death knights on (x + 1, y - 1) & (x - 1, y - 1)
     */

    lastSpawn: number;
    minions: Array<any>;

    constructor(character: Mob) {
        character.spawnDistance = 10;
        super(character);

        const self = this;

        self.lastSpawn = 0;

        self.minions = [];

        character.onDeath(() => {
            self.reset();
        });
    }

    reset() {
        const self = this;

        self.lastSpawn = 0;

        const listCopy = self.minions.slice();

        for (let i = 0; i < listCopy.length; i++) self.world.kill(listCopy[i]);
    }

    hit(character: Character, target: Character, hitInfo: any) {
        const self = this;

        if (self.isAttacked()) self.beginMinionAttack();

        if (self.canSpawn()) self.spawnMinions();

        super.hit(character, target, hitInfo);
    }

    spawnMinions() {
        const self = this,
            x = self.character.x,
            y = self.character.y;

        self.lastSpawn = new Date().getTime();

        if (!self.colliding(x + 2, y - 2)) self.minions.push(self.world.spawnMob(17, x + 2, y + 2));

        if (!self.colliding(x - 2, y - 2)) self.minions.push(self.world.spawnMob(17, x - 2, y + 2));

        if (!self.colliding(x + 1, y + 1)) self.minions.push(self.world.spawnMob(11, x + 1, y - 1));

        if (!self.colliding(x - 1, y + 1)) self.minions.push(self.world.spawnMob(11, x - 1, y - 1));

        _.each(self.minions, (minion: Mob) => {
            minion.onDeath(() => {
                if (self.isLast()) self.lastSpawn = new Date().getTime();

                self.minions.splice(self.minions.indexOf(minion), 1);
            });

            if (self.isAttacked()) self.beginMinionAttack();
        });
    }

    beginMinionAttack() {
        const self = this;

        if (!self.hasMinions()) return;

        _.each(self.minions, (minion: Mob) => {
            const randomTarget = self.getRandomTarget();

            if (!minion.hasTarget() && randomTarget) minion.combat.begin(randomTarget);
        });
    }

    getRandomTarget() {
        const self = this;

        if (self.isAttacked()) {
            const keys = Object.keys(self.attackers),
                randomAttacker = self.attackers[keys[Utils.randomInt(0, keys.length)]];

            if (randomAttacker) return randomAttacker;
        }

        if (self.character.hasTarget()) return self.character.target;

        return null;
    }

    hasMinions() {
        return this.minions.length > 0;
    }

    isLast() {
        return this.minions.length === 1;
    }

    canSpawn() {
        return (
            new Date().getTime() - this.lastSpawn > 25000 && !this.hasMinions() && this.isAttacked()
        );
    }
}

export default SkeletonKing;
