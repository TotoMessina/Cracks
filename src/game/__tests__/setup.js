// Every test starts with every club in its original league (promotions/relegations change the world)
import { beforeEach } from 'vitest';
import { setWorld } from '../../data/clubs';

beforeEach(() => setWorld({}));
