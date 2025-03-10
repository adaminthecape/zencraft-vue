<template>
  <SimpleLayout headerBackgroundColor="var(--q-dark)">
    <template #header-title>{{ $t('login.logIn') }}</template>
    <template #header-right>
      <ThemeButton
        v-if="hasJwt"
        :label="$t('login.goHome')"
        flat
        color="white"
        @click="goHome"
      />
    </template>
    <template #page-content>
      <div class="column row items-center justify-center">
        <div
          class="row flex-col justify-center"
          style="overflow: hidden;min-height:92vh;"
        >
          <q-card style="width:400px;height:540px;">
            <q-card-section class="bg-primary">
              <span class="text-h5 text-white q-my-md">{{
                isRegistered ? $t('login.logIn') : $t('login.register')
              }}</span>
            </q-card-section>
            <q-card-section>
            <q-fab
              color="positive"
              icon="add"
              class="absolute q-mb-sm"
              style="top: 0; right: 12px; transform: translateY(-50%);"
              @click="() => { isRegistered = !isRegistered; }"
            >
              <q-tooltip>{{ $t('login.register') }}</q-tooltip>
            </q-fab>
              <q-form class="q-px-sm q-pt-xl">
                <q-input
                  v-if="!isRegistered"
                  clearable
                  filled
                  v-model="email"
                  type="email"
                  lazy-rules
                  label="Email"
                  class="q-mb-sm"
                >
                  <template v-slot:prepend>
                    <ThemeIcon name="email" />
                  </template>
                </q-input>
                <q-input
                  v-model="username"
                  clearable
                  filled
                  lazy-rules
                  type="text"
                  :label="$t('login.username')"
                  class="q-mb-sm"
                >
                  <template v-slot:prepend>
                    <ThemeIcon name="person" />
                  </template>
                </q-input>
                <q-input
                  v-model="password"
                  clearable
                  filled
                  :type="isPasswordVisible ? 'text' : 'password'"
                  lazy-rules
                  :label="$t('login.password')"
                  class="q-mb-sm"
                >

                  <template v-slot:prepend>
                    <ThemeIcon name="lock" />
                  </template>
                  <template v-slot:append>
                <ThemeIcon
                    :name="isPasswordVisible ? 'visibility_off' : 'visibility'"
                    class="cursor-pointer"
                    @click="() => { isPasswordVisible = !isPasswordVisible; }"
                  />
                  </template>
                </q-input>
                <q-input
                    v-if="!isRegistered"
                    clearable
                    filled
                    v-model="confirmPassword"
                    :type="isPasswordVisible ? 'text' : 'password'"
                    lazy-rules
                    :label="$t('login.confirmPassword')"
                  >
                  <template v-slot:prepend>
                    <ThemeIcon name="lock" />
                  </template>
              <template v-slot:append>
            <ThemeIcon
              :name="isPasswordVisible ? 'visibility_off' : 'visibility'"
              class="cursor-pointer"
              @click="() => { isPasswordVisible = !isPasswordVisible; }"
            />
            </template>
                </q-input>
              </q-form>
            </q-card-section>

            <q-card-actions class="q-px-lg">
              <ThemeButton
                unelevated
                size="lg"
                color="secondary"
                @click="submit"
                class="full-width text-white"
                :label="$t('login.submit')"
              />
            </q-card-actions>
            <q-card-section
                v-if="isRegistered"
                class="text-center q-pa-sm">
              <p class="text-grey-6">{{ $t('login.forgotPassword') }}</p>
            </q-card-section>
          </q-card>
        </div>
      </div>
    </template>
  </SimpleLayout>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import SimpleLayout from 'src/components/ui/SimpleLayout.vue';
import { computed, inject, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import ThemeButton from '../buttons/ThemeButton.vue';
import { AppHelpers } from 'src/types/generic';
import ThemeIcon from 'src/components/ui/ThemeIcon.vue';

const $q = useQuasar();
const { t: $t } = useI18n();

const isRegistered = ref(true);
const isPasswordVisible = ref(false);
const email = ref<string>();
const username = ref<string>();
const password = ref<string>();
const confirmPassword = ref<string>();

const { login } = (inject('helpers') as AppHelpers['helpers']) || {};

const router = useRouter();

async function submit(): Promise<void>
{
  if(!username.value || !password.value)
  {
    return;
  }

  const success = await login(username.value, password.value);

  if(!success)
  {
    $q.notify($t('login.toast.failure'));
  }
  else
  {
    $q.notify($t('login.toast.success'));
    router.push('/');
  }
}

const hasJwt = computed(() => !!localStorage.getItem('jwt'));

function goHome()
{
  router.replace({
    path: '/'
  });
}
</script>
