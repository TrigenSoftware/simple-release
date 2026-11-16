import {
  describe,
  it,
  expect
} from 'vitest'
import { isBreakingBump } from './utils.js'

describe('core', () => {
  describe('utils', () => {
    describe('isBreakingBump', () => {
      it('should treat major bumps as breaking', () => {
        expect(isBreakingBump('3.3.1', '4.0.0')).toBe(true)
        expect(isBreakingBump('2.4.0', '3.3.2')).toBe(true)
      })

      it('should not treat minor and patch bumps as breaking', () => {
        expect(isBreakingBump('3.3.1', '3.4.0')).toBe(false)
        expect(isBreakingBump('3.3.1', '3.3.2')).toBe(false)
        expect(isBreakingBump('0.3.1', '0.3.2')).toBe(false)
      })

      it('should treat minor bumps of 0.x versions as breaking', () => {
        expect(isBreakingBump('0.3.1', '0.4.0')).toBe(true)
      })

      it('should treat patch bumps of 0.0.x versions as breaking', () => {
        expect(isBreakingBump('0.0.3', '0.0.4')).toBe(true)
      })

      it('should treat entering a major prerelease as breaking', () => {
        expect(isBreakingBump('3.3.1', '4.0.0-alpha.0')).toBe(true)
      })

      it('should not treat entering a minor or patch prerelease as breaking', () => {
        expect(isBreakingBump('3.3.1', '3.4.0-alpha.0')).toBe(false)
        expect(isBreakingBump('3.3.1', '3.3.2-alpha.0')).toBe(false)
      })

      it('should not treat bumps within a prerelease as breaking', () => {
        expect(isBreakingBump('4.0.0-alpha.0', '4.0.0-alpha.1')).toBe(false)
        expect(isBreakingBump('4.0.0-alpha.1', '4.0.0-beta.0')).toBe(false)
      })

      it('should treat graduating from a major prerelease as breaking', () => {
        expect(isBreakingBump('4.0.0-alpha.1', '4.0.0')).toBe(true)
      })

      it('should not treat graduating from a minor prerelease as breaking', () => {
        expect(isBreakingBump('3.4.0-alpha.1', '3.4.0')).toBe(false)
      })
    })
  })
})
