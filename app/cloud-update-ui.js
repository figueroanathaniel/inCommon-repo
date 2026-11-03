/* Host-only recovery notice and local writing-copy orchestration. No reload. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.CloudUpdateUI = factory(root);
}(typeof self !== 'undefined' ? self : this, function (root) {
  'use strict';
  function hostMethods(env) {
    return {
      cloudRecoveryScope: function () {
        var status = this.cloud && this.cloud.status(), pm = this.PM();
        var profile = pm && pm.activeId && pm.activeId();
        if (!status || !status.userId || !profile || !pm.getProfile(profile)) return null;
        var tab = env.sessionStorage.getItem('incommon.update.tab');
        if (!tab) { tab = env.crypto.randomUUID(); env.sessionStorage.setItem('incommon.update.tab', tab); }
        return { account: status.userId, profile: profile, tab: tab };
      },
      cloudUpgradeRequired: function () {
        if (this._cloudDraftStopped) return;
        this._cloudDraftTracking = true;
        this.setState({ cloudNoticeOpen: true, cloudFormsReady: false,
          cloudFormGuardMsg: 'Open forms must be checked before updating.',
          cloudDraftMsg: 'Sync needs an app update. You can keep working here.' });
        this.cloudRecoveryTrack();
      },
      cloudRecoveryTrack: function () {
        if (!this.state.ready || this._cloudDraftStopped) return;
        var scope, self = this, drafts = env.CloudUpdateDrafts;
        try { scope = this.cloudRecoveryScope(); } catch (e) {
          if (this._cloudDraftTracking) this.setState({ cloudDraftMsg: 'Recovery storage is unavailable. Keep this tab open.' });
          this._cloudDraftTracking = false; return;
        }
        if (!scope || !drafts) return;
        var signature = JSON.stringify(scope);
        if (this._cloudDraftScope !== signature) {
          var changedOwner = !!this._cloudDraftScope;
          if (changedOwner) this._cloudDraftTracking = false;
          this._cloudDraftScope = signature; this._cloudDraftLoading = true;
          this._cloudDraftEpoch = (this._cloudDraftEpoch || 0) + 1;
          var epoch = this._cloudDraftEpoch;
          this._cloudDraftRecord = null; this._cloudDraftStamp = null;
          this._cloudDraftReadFailed = false;
          this.setState(Object.assign({ cloudDraftAvailable: false, cloudDraftBusy: false },
            changedOwner ? { cloudNoticeOpen: false, cloudDraftMsg: '' } : {}));
          drafts.store().load(scope).then(function (record) {
            if (self._cloudDraftStopped || self._cloudDraftScope !== signature || self._cloudDraftEpoch !== epoch) return;
            self._cloudDraftLoading = false; self._cloudDraftRecord = record;
            if (record) self.setState({ cloudNoticeOpen: true, cloudDraftAvailable: true,
              cloudDraftMsg: 'A writing draft copy from this tab is available.' });
            self.cloudRecoveryTrack();
          }, function () {
            if (self._cloudDraftStopped || self._cloudDraftScope !== signature || self._cloudDraftEpoch !== epoch) return;
            self._cloudDraftLoading = false; self._cloudDraftTracking = false;
            self._cloudDraftReadFailed = true;
            self.setState({ cloudDraftMsg: 'Draft copy could not be read. Keep this tab open.' });
          });
          return;
        }
        if (!this._cloudDraftTracking || this._cloudDraftLoading || this._cloudDraftSaving || this._cloudDraftRecord) return;
        try {
          var stamp = JSON.stringify(drafts.pick(this.state));
          if (stamp !== this._cloudDraftStamp) this.cloudRecoverySave();
        } catch (e) {
          this._cloudDraftTracking = false;
          this.setState({ cloudDraftMsg: 'Draft copy could not be saved. Keep this tab open.' });
        }
      },
      cloudRecoverySave: function () {
        var scope, fields, self = this, drafts = env.CloudUpdateDrafts;
        if (this._cloudDraftSaving || this._cloudDraftLoading || this._cloudDraftStopped) return;
        if (this._cloudDraftReadFailed) {
          this._cloudDraftScope = null; this._cloudDraftTracking = true;
          this.cloudRecoveryTrack(); return;
        }
        if (this._cloudDraftRecord) {
          this.setState({ cloudDraftMsg: 'Restore the saved copy before replacing it.' }); return;
        }
        try { scope = this.cloudRecoveryScope(); fields = drafts.pick(this.state); if (!scope) throw Error('No owner'); }
        catch (e) { this.setState({ cloudDraftMsg: 'Draft copy could not be saved. Keep this tab open.' }); return; }
        var signature = JSON.stringify(scope), stamp = JSON.stringify(fields), epoch = this._cloudDraftEpoch;
        var unlock = this.cloudRecoveryLockInput();
        this._cloudDraftUnlock = unlock;
        this._cloudDraftSaving = true;
        this.setState({ cloudDraftBusy: true });
        drafts.store().save(scope, fields).then(function () {
          unlock(); if (self._cloudDraftUnlock === unlock) self._cloudDraftUnlock = null;
          self._cloudDraftSaving = false;
          if (self._cloudDraftStopped || self._cloudDraftScope !== signature || self._cloudDraftEpoch !== epoch) { self.cloudRecoveryTrack(); return; }
          self._cloudDraftStamp = stamp;
          self.setState({ cloudDraftBusy: false, cloudDraftMsg: Object.keys(fields).length
            ? 'Writing draft copy saved on this device for up to 24 hours.' : 'No writing drafts need a recovery copy.' });
          self.cloudRecoveryTrack();
          self.cloudRecoveryCheckForms();
        }, function () {
          unlock(); if (self._cloudDraftUnlock === unlock) self._cloudDraftUnlock = null;
          self._cloudDraftSaving = false;
          if (self._cloudDraftStopped || self._cloudDraftScope !== signature || self._cloudDraftEpoch !== epoch) return;
          self._cloudDraftTracking = false;
          self.setState({ cloudDraftBusy: false, cloudDraftMsg: 'Draft copy could not be saved. Keep this tab open.' });
        });
      },
      cloudRecoveryLockInput: function () {
        var field = env.document && env.document.activeElement;
        if (!field || !/^(INPUT|TEXTAREA)$/.test(field.tagName) || field.type === 'password' ||
            /password|one-time-code/.test(field.autocomplete || '')) return function () {};
        var previous = field.readOnly, released = false;
        field.readOnly = true;
        /* A slow/unresponsive storage backend must not leave the editor frozen.
           Later edits are copied by the normal state tracker after this save. */
        var timeout = setTimeout(release, 1000);
        function release() {
          if (released) return;
          released = true; clearTimeout(timeout); field.readOnly = previous;
        }
        return release;
      },
      cloudRecoveryInvalidateForms: function () {
        this._cloudFormGeneration = (this._cloudFormGeneration || 0) + 1;
        if (!this._cloudDraftStopped && (this.state.cloudFormsReady || this.state.cloudFormChecking)) {
          this.setState({ cloudFormsReady: false, cloudFormChecking: false,
            cloudFormGuardMsg: 'Save your latest changes before updating.' });
        }
      },
      cloudRecoveryGuardTrack: function () {
        var stamp;
        try { stamp = JSON.stringify(env.CloudUpdateDrafts.pick(this.state)); } catch (e) { stamp = 'invalid'; }
        if (stamp !== this._cloudFormStamp) { this._cloudFormStamp = stamp; this.cloudRecoveryInvalidateForms(); }
      },
      cloudRecoveryCheckForms: function () {
        var self = this, scope, signature, generation;
        function blocked(reason) { return { allowed: false, formsReady: false, reason: reason,
          message: 'Keep this tab open. Open forms could not be verified.' }; }
        if (this._cloudDraftStopped) return Promise.resolve(blocked('UNMOUNTED'));
        if (!env.ReloadGuard || !env.CloudUpdateDrafts) return Promise.resolve(blocked('GUARD_UNAVAILABLE'));
        try {
          scope = this.cloudRecoveryScope(); if (!scope) throw Error('No owner');
          signature = JSON.stringify(scope);
          this._cloudFormStamp = JSON.stringify(env.CloudUpdateDrafts.pick(this.state));
        } catch (e) { return Promise.resolve(blocked('FORM_CONTEXT_UNAVAILABLE')); }
        generation = this._cloudFormGeneration = (this._cloudFormGeneration || 0) + 1;
        this.setState({ cloudFormsReady: false, cloudFormChecking: true });
        return env.CloudUpdateDrafts.store().load(scope).then(function (snapshot) {
          if (self._cloudDraftStopped || generation !== self._cloudFormGeneration) return blocked('INPUT_OR_SCOPE_CHANGED');
          if (signature !== JSON.stringify(self.cloudRecoveryScope())) {
            self.setState({ cloudFormsReady: false, cloudFormChecking: false,
              cloudFormGuardMsg: 'Check open forms again in the current profile.' });
            return blocked('INPUT_OR_SCOPE_CHANGED');
          }
          var result = env.ReloadGuard.evaluate({ state: self.state, document: env.document,
            scope: scope, snapshot: snapshot, saving: self._cloudDraftSaving });
          self.setState({ cloudFormsReady: result.formsReady, cloudFormChecking: false, cloudFormGuardMsg: result.message });
          return result;
        }).catch(function () {
          var result = blocked('BACKUP_READ_FAILED');
          if (!self._cloudDraftStopped && generation === self._cloudFormGeneration) self.setState({
            cloudFormsReady: false, cloudFormChecking: false, cloudFormGuardMsg: result.message });
          return result;
        });
      },
      cloudRecoveryRestore: function () {
        var scope, patch;
        try {
          scope = this.cloudRecoveryScope();
          if (!scope || JSON.stringify(scope) !== this._cloudDraftScope || !this._cloudDraftRecord) return;
          if (this._cloudDraftRecord.expires <= Date.now()) {
            this._cloudDraftRecord = null;
            this.setState({ cloudDraftAvailable: false, cloudDraftMsg: 'The recovery copy has expired. Nothing was replaced.' });
            env.CloudUpdateDrafts.store().remove(scope).catch(function () {}); return;
          }
          patch = env.CloudUpdateDrafts.restore(this.state, this._cloudDraftRecord.fields);
        } catch (e) {
          this.setState({ cloudDraftMsg: 'Current writing differs from the saved copy. Nothing was replaced.' }); return;
        }
        this._cloudDraftRecord = null; this._cloudDraftTracking = true;
        this._cloudDraftStamp = JSON.stringify(env.CloudUpdateDrafts.pick(Object.assign({}, this.state, patch)));
        this.setState(Object.assign({}, patch, { cloudDraftAvailable: false,
          cloudDraftMsg: 'Writing drafts restored. Review them before saving.' }));
      },
      cloudRecoveryStop: function () {
        this._cloudDraftStopped = true;
        this._cloudFormGeneration = (this._cloudFormGeneration || 0) + 1;
        if (this._cloudDraftUnlock) { this._cloudDraftUnlock(); this._cloudDraftUnlock = null; }
      },
      cloudRecoveryForgetAccount: function () {
        var status = this.cloud && this.cloud.status(), drafts = env.CloudUpdateDrafts;
        this._cloudDraftTracking = false; this._cloudDraftScope = null;
        this._cloudFormGeneration = (this._cloudFormGeneration || 0) + 1;
        this._cloudDraftRecord = null; this._cloudDraftEpoch = (this._cloudDraftEpoch || 0) + 1;
        this.setState({ cloudNoticeOpen: false, cloudDraftAvailable: false, cloudDraftBusy: false,
          cloudFormsReady: false, cloudFormChecking: false, cloudFormGuardMsg: '' });
        if (!drafts || !status || !status.userId) return Promise.resolve();
        return drafts.store().removeAccount(status.userId).catch(function () {
          if (env.dispatchEvent && env.CustomEvent) env.dispatchEvent(new env.CustomEvent('drafts:cleanup-failed'));
        });
      },
      cloudRecoveryVals: function () {
        return {
          cloudNoticeOn: !!(this.state.cloudNoticeOpen && this.state.cloudStatus && this.state.cloudStatus.userId),
          cloudNoticeTitle: this.state.cloudStatus && this.state.cloudStatus.upgradeRequired ? 'Update needed to sync' : 'Writing draft recovery',
          cloudDraftMsg: this.state.cloudDraftMsg || 'You can keep working on this device.',
          cloudDraftAvailable: !!this.state.cloudDraftAvailable,
          cloudDraftBusy: !!this.state.cloudDraftBusy,
          cloudFormGuardOn: !!this.state.cloudFormGuardMsg,
          cloudFormGuardMsg: this.state.cloudFormGuardMsg || '',
          cloudFormChecking: !!this.state.cloudFormChecking
        };
      }
    };
  }
  return { createHostMethods: hostMethods, hostMethods: hostMethods(root) };
}));
