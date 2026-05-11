<template>
  <Container>
    <div class="grid grid-cols-1 gap-24 md:grid-cols-[216px_1fr]">
      <div>
        <Card class="sticky top-100">
          <CardContent class="p-16 pb-8">
            <div class="relative">
              <Input
                type="search"
                size="sm"
                class="pl-32 pr-12"
                placeholder="검색 어를 입력해주세요."
                title="Components 검색"
                v-model="searchKeyword">
                <template #icon>
                  <i class="material-icons absolute left-10 top-10 text-gray-600">search</i>
                </template>
              </Input>
            </div>
          </CardContent>
          <CardContent class="mb-16 max-h-[70vh] overflow-y-auto p-8">
            <ul class="px-8 py-0">
              <li :key="component.path" v-for="component in filteredComponentItems">
                <a
                  :href="component.path"
                  :class="
                    cn(
                      'flex items-center gap-8 rounded-md px-8 py-6 text-14 text-gray-600 transition-colors',
                      'hover:bg-gray-100 hover:text-gray-900',
                      activeSection === component.path &&
                        'bg-primary-foreground font-medium text-primary'
                    )
                  "
                  @click.prevent="scrollToSection(component.path)">
                  {{ component.label }}
                </a>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
      <div class="">
        <section id="textSection" class="mb-24 rounded-md bg-white p-16">
          <h3 class="text-24 font-medium text-gray-800">Text</h3>
          <div class="content mt-16">
            <!-- 1. 기본 옵션 배열만 사용 -->
            <Card class="mb-24">
              <CardHeader>
                <div class="flex items-center justify-between">
                  <div>
                    <CardTitle>Text</CardTitle>
                  </div>
                  <div>
                    <SwitchSquare
                      class="content-end"
                      :options="[
                        { value: 'preview', label: 'Preview', icon: 'visibility' },
                        { value: 'code', label: 'Code', icon: 'integration_instructions' },
                      ]"
                      v-model="previewState['text']" />
                  </div>
                </div>
              </CardHeader>
              <CardContent v-show="previewState['text'] == 'preview'">
                <div class="grid grid-cols-2 gap-16">
                  <div class="col-span-2">
                    <p class="text-sm">Lorem ipsum dolor sit 모든 국민은 생활할 권리를 가지며</p>
                    <p class="text-md">Lorem ipsum dolor sit 모든 국민은 생활할 권리를 가지며</p>
                    <p class="text-lg">Lorem ipsum dolor sit 모든 국민은 생활할 권리를 가지며</p>
                  </div>
                  <div>
                    <p class="text-red">(text-red => 적용 안됨)</p>
                    <p class="text-red-100">text-red-100 모든 국민은 생활할 권리를 가지며</p>
                    <p class="text-red-200">text-red-200 모든 국민은 생활할 권리를 가지며</p>
                    <p class="text-red-300">text-red-300 모든 국민은 생활할 권리를 가지며</p>
                    <p class="text-red-400">text-red-400 모든 국민은 생활할 권리를 가지며</p>
                    <p class="text-red-500">text-red-500 모든 국민은 생활할 권리를 가지며</p>
                    <p class="text-red-600">text-red-600 모든 국민은 생활할 권리를 가지며</p>
                    <p class="text-red-700">text-red-700 모든 국민은 생활할 권리를 가지며</p>
                    <p class="text-red-800">text-red-800 모든 국민은 생활할 권리를 가지며</p>
                    <p class="text-red-900">text-red-900 모든 국민은 생활할 권리를 가지며</p>
                  </div>
                  <div>
                    <p class="text-gray">(text-gray => 적용 안됨)</p>
                    <p class="text-gray-100">text-gray-100 모든 국민은 생활할 권리를 가지며</p>
                    <p class="text-gray-200">text-gray-200 모든 국민은 생활할 권리를 가지며</p>
                    <p class="text-gray-300">text-gray-300 모든 국민은 생활할 권리를 가지며</p>
                    <p class="text-gray-400">text-gray-400 모든 국민은 생활할 권리를 가지며</p>
                    <p class="text-gray-500">text-gray-500 모든 국민은 생활할 권리를 가지며</p>
                    <p class="text-gray-600">text-gray-600 모든 국민은 생활할 권리를 가지며</p>
                    <p class="text-gray-700">text-gray-700 모든 국민은 생활할 권리를 가지며</p>
                    <p class="text-gray-800">text-gray-800 모든 국민은 생활할 권리를 가지며</p>
                    <p class="text-gray-900">text-gray-900 모든 국민은 생활할 권리를 가지며</p>
                  </div>
                </div>
                <br />

                <p class="text-blue-500">text-blue-500 모든 국민은 생활할 권리를 가지며</p>
                <p class="text-indigo-500">text-indigo-500 모든 국민은 생활할 권리를 가지며</p>
                <p class="text-purple-500">text-purple-500 모든 국민은 생활할 권리를 가지며</p>
                <p class="text-pink-500">text-pink-500 모든 국민은 생활할 권리를 가지며</p>
                <p class="text-orange-500">text-orange-500 모든 국민은 생활할 권리를 가지며</p>
                <p class="text-yellow-500">text-yellow-500 모든 국민은 생활할 권리를 가지며</p>
                <p class="text-navy-500">text-navy-500 모든 국민은 생활할 권리를 가지며</p>
                <p class="text-teal-500">text-teal-500 모든 국민은 생활할 권리를 가지며</p>
                <p class="text-cyan-500">text-cyan-500 모든 국민은 생활할 권리를 가지며</p>

                <br />
                <p class="text-primary">text-primary 모든 국민은 생활할 권리를 가지며</p>
                <p class="text-secondary">text-secondary 모든 국민은 생활할 권리를 가지며</p>
                <p class="text-danger">text-danger 모든 국민은 생활할 권리를 가지며</p>
              </CardContent>
              <CardContent v-show="previewState['text'] == 'code'">
                <CodeBlock
                  :code="`
<!-- Text Size -->
<p class=&quot;text-sm&quot;>Lorem ipsum dolor sit 모든 국민은 생활할 권리를 가지며</p>
<p class=&quot;text-md&quot;>Lorem ipsum dolor sit 모든 국민은 생활할 권리를 가지며</p>
<p class=&quot;text-lg&quot;>Lorem ipsum dolor sit 모든 국민은 생활할 권리를 가지며</p>
<p class=&quot;&quot;>Lorem ipsum dolor sit 모든 국민은 생활할 권리를 가지며</p>

<!-- Text Color Shade -->
<p class=&quot;text-red&quot;>(text-red => 적용 안됨)</p>
<p class=&quot;text-red-100&quot;>text-red-100 모든 국민은 생활할 권리를 가지며</p>
<p class=&quot;text-red-200&quot;>text-red-200 모든 국민은 생활할 권리를 가지며</p>
<p class=&quot;text-red-300&quot;>text-red-300 모든 국민은 생활할 권리를 가지며</p>
<p class=&quot;text-red-400&quot;>text-red-400 모든 국민은 생활할 권리를 가지며</p>
<p class=&quot;text-red-500&quot;>text-red-500 모든 국민은 생활할 권리를 가지며</p>
<p class=&quot;text-red-600&quot;>text-red-600 모든 국민은 생활할 권리를 가지며</p>
<p class=&quot;text-red-700&quot;>text-red-700 모든 국민은 생활할 권리를 가지며</p>
<p class=&quot;text-red-800&quot;>text-red-800 모든 국민은 생활할 권리를 가지며</p>
<p class=&quot;text-red-900&quot;>text-red-900 모든 국민은 생활할 권리를 가지며</p>

<p class=&quot;text-gray&quot;>(text-gray => 적용 안됨)</p>
<p class=&quot;text-gray-100&quot;>text-gray-100 모든 국민은 생활할 권리를 가지며</p>
<p class=&quot;text-gray-200&quot;>text-gray-200 모든 국민은 생활할 권리를 가지며</p>
<p class=&quot;text-gray-300&quot;>text-gray-300 모든 국민은 생활할 권리를 가지며</p>
<p class=&quot;text-gray-400&quot;>text-gray-400 모든 국민은 생활할 권리를 가지며</p>
<p class=&quot;text-gray-500&quot;>text-gray-500 모든 국민은 생활할 권리를 가지며</p>
<p class=&quot;text-gray-600&quot;>text-gray-600 모든 국민은 생활할 권리를 가지며</p>
<p class=&quot;text-gray-700&quot;>text-gray-700 모든 국민은 생활할 권리를 가지며</p>
<p class=&quot;text-gray-800&quot;>text-gray-800 모든 국민은 생활할 권리를 가지며</p>
<p class=&quot;text-gray-900&quot;>text-gray-900 모든 국민은 생활할 권리를 가지며</p>

<!-- Text Window Color -->
  <p class=&quot;text-blue-500&quot;>text-blue-500 모든 국민은 생활할 권리를 가지며</p>
  <p class=&quot;text-indigo-500&quot;>text-indigo-500 모든 국민은 생활할 권리를 가지며</p>
  <p class=&quot;text-purple-500&quot;>text-purple-500 모든 국민은 생활할 권리를 가지며</p>
  <p class=&quot;text-pink-500&quot;>text-pink-500 모든 국민은 생활할 권리를 가지며</p>
  <p class=&quot;text-orange-500&quot;>text-orange-500 모든 국민은 생활할 권리를 가지며</p>
  <p class=&quot;text-yellow-500&quot;>text-yellow-500 모든 국민은 생활할 권리를 가지며</p>
  <p class=&quot;text-navy-500&quot;>text-navy-500 모든 국민은 생활할 권리를 가지며</p>
  <p class=&quot;text-teal-500&quot;>text-teal-500 모든 국민은 생활할 권리를 가지며</p>
  <p class=&quot;text-cyan-500&quot;>text-cyan-500 모든 국민은 생활할 권리를 가지며</p>

<!-- Text Custom Color -->
  <p class=&quot;text-primary&quot;>text-primary 모든 국민은 생활할 권리를 가지며</p>
  <p class=&quot;text-secondary&quot;>text-secondary 모든 국민은 생활할 권리를 가지며</p>
  <p class=&quot;text-danger&quot;>text-adnger 모든 국민은 생활할 권리를 가지며</p>
                  `" />
              </CardContent>
            </Card>
          </div>
        </section>

        <section id="inputSection" class="mb-24 rounded-md bg-white p-16">
          <h3 class="text-24 font-medium text-gray-800">Input</h3>
          <div class="content mt-16">
            <!-- 기본 -->
            <Card class="mb-24">
              <CardHeader>
                <div class="flex items-center justify-between">
                  <div>
                    <CardTitle>Input</CardTitle>
                    <CardDescription>Input 커스텀 ui</CardDescription>
                  </div>
                  <div>
                    <SwitchSquare
                      class="content-end"
                      :options="[
                        { value: 'preview', label: 'Preview', icon: 'visibility' },
                        { value: 'code', label: 'Code', icon: 'integration_instructions' },
                      ]"
                      v-model="previewState['vue-input']" />
                  </div>
                </div>
              </CardHeader>
              <CardContent v-show="previewState['vue-input'] == 'preview'">
                <div class="grid grid-cols-2 gap-16">
                  <div>
                    <Label for="inputId_1">input 확인</Label>
                    <Input
                      id="inputId_1"
                      type="input"
                      default-value="input defaultValue 입니다."
                      placeholder="텍스트를 작성해주세요."
                      v-model="inputText" />
                  </div>
                  <!-- invalid -->
                  <div>
                    <Label for="inputId_2">input invalid 확인</Label>
                    <Input
                      id="inputId_2"
                      type="input"
                      default-value="defaultValue 입니다."
                      :invalid="true"
                      invalid-message="invalid text를 확인해주세요."
                      placeholder="텍스트를 작성해주세요." />
                  </div>
                  <!-- icon -->
                  <div>
                    <Label for="inputId_11">input icon</Label>
                    <Input
                      id="inputId_11"
                      type="input"
                      default-value="input defaultValue 입니다."
                      placeholder="텍스트를 작성해주세요."
                      class="pl-40"
                      v-model="inputText">
                      <template #icon>
                        <i
                          class="material-icons pointer-events-none absolute left-12 top-[50%] translate-y-[-50%] text-20 text-gray-400">
                          account_circle
                        </i>
                      </template>
                    </Input>
                  </div>
                  <div>
                    <Label for="inputId_12">input icon</Label>
                    <Input
                      id="inputId_12"
                      type="input"
                      default-value="input defaultValue 입니다."
                      placeholder="텍스트를 작성해주세요."
                      :invalid="true"
                      invalid-message="invalid text를 확인해주세요."
                      class="pl-40"
                      v-model="inputText">
                      <template #icon>
                        <i
                          class="material-icons pointer-events-none absolute left-12 top-[50%] translate-y-[-50%] text-20 text-gray-400">
                          account_circle
                        </i>
                      </template>
                    </Input>
                  </div>
                  <!-- style - line -->
                  <div>
                    <Label for="inputStyle_1">input style 확인</Label>
                    <Input
                      id="inputStyle_1"
                      type="input"
                      input-style="line"
                      default-value="input defaultValue 입니다."
                      placeholder="텍스트를 작성해주세요."
                      v-model="inputText" />
                  </div>
                  <div>
                    <Label for="inputStyle_2">input 확인</Label>
                    <Input
                      id="inputStyle_2"
                      type="input"
                      input-style="line"
                      :invalid="true"
                      invalid-message="invalid text를 확인해주세요."
                      default-value="input defaultValue 입니다."
                      placeholder="텍스트를 작성해주세요."
                      v-model="inputText" />
                  </div>
                  <!-- size 확인 + clear -->
                  <div>
                    <Label for="inputId_5">sm input 확인 + clear</Label>
                    <Input
                      id="inputId_5"
                      type="input"
                      placeholder="텍스트를 작성해주세요."
                      size="sm"
                      :clear="true" />
                  </div>
                  <div>
                    <Label for="inputId_6">lg input 확인 + clear</Label>
                    <Input
                      id="inputId_6"
                      type="input"
                      placeholder="텍스트를 작성해주세요."
                      size="lg"
                      :clear="true" />
                  </div>
                </div>
              </CardContent>
              <CardContent v-show="previewState['vue-input'] == 'code'">
                <CodeBlock
                  :code="`
<!-- 일반 input -->
<Label for=&quot;inputId_1&quot;>input 확인</Label>
<Input
  id=&quot;inputId_1&quot;
  type=&quot;input&quot;
  default-value=&quot;input defaultValue 입니다.&quot;
  placeholder=&quot;텍스트를 작성해주세요.&quot;
  v-model=&quot;inputText&quot; />

<!-- invalid -->
<Label for=&quot;inputId_2&quot;>input invalid 확인</Label>
<Input
  id=&quot;inputId_2&quot;
  type=&quot;input&quot;
  default-value=&quot;defaultValue 입니다.&quot;
  :invalid=&quot;true&quot;
  invalid-message=&quot;invalid text를 확인해주세요.&quot;
  placeholder=&quot;텍스트를 작성해주세요.&quot; />


  <!-- icon -->
  <Label for=&quot;inputId_11&quot;>input icon</Label>
  <Input
    id=&quot;inputId_11&quot;
    type=&quot;input&quot;
    default-value=&quot;input defaultValue 입니다.&quot;
    placeholder=&quot;텍스트를 작성해주세요.&quot;
    v-model=&quot;inputText&quot;
    class=&quot;pl-40&quot;>
    <template #icon>
      <i
        class=&quot;material-icons pointer-events-none absolute left-12 top-[50%] translate-y-[-50%] text-20 text-gray-400&quot;>
        account_circle
      </i>
    </template>
  </Input>
  <Label for=&quot;inputId_12&quot;>input icon</Label>
  <Input
    id=&quot;inputId_12&quot;
    type=&quot;input&quot;
    default-value=&quot;input defaultValue 입니다.&quot;
    placeholder=&quot;텍스트를 작성해주세요.&quot;
    v-model=&quot;inputText&quot;
    :invalid=&quot;true&quot;
    invalid-message=&quot;invalid text를 확인해주세요.&quot;
    class=&quot;pl-40&quot;>
    <template #icon>
      <i
        class=&quot;material-icons pointer-events-none absolute left-12 top-[50%] translate-y-[-50%] text-20 text-gray-400&quot;>
        account_circle
      </i>
    </template>
  </Input>
  
<!-- style - line -->
<div>
  <Label for=&quot;inputStyle_1&quot;>input style 확인</Label>
  <Input
    id=&quot;inputStyle_1&quot;
    type=&quot;input&quot;
    input-style=&quot;line&quot;
    default-value=&quot;input defaultValue 입니다.&quot;
    placeholder=&quot;텍스트를 작성해주세요.&quot;
    v-model=&quot;inputText&quot; />
</div>
<div>
  <Label for=&quot;inputStyle_2&quot;>input 확인</Label>
  <Input
    id=&quot;inputStyle_2&quot;
    type=&quot;input&quot;
    input-style=&quot;line&quot;
    :invalid=&quot;true&quot;
    invalid-message=&quot;invalid text를 확인해주세요.&quot;
    default-value=&quot;input defaultValue 입니다.&quot;
    placeholder=&quot;텍스트를 작성해주세요.&quot;
    v-model=&quot;inputText&quot; />
</div>

<!-- size 확인 + clear -->
<Label for=&quot;inputId_5&quot;>sm input 확인 + clear</Label>
<Input
  id=&quot;inputId_5&quot;
  type=&quot;input&quot;
  placeholder=&quot;텍스트를 작성해주세요.&quot;
  size=&quot;sm&quot;
  :clear=&quot;true&quot; />

<Label for=&quot;inputId_6&quot;>lg input 확인 + clear</Label>
<Input
  id=&quot;inputId_6&quot;
  type=&quot;input&quot;
  placeholder=&quot;텍스트를 작성해주세요.&quot;
  size=&quot;lg&quot;
  :clear=&quot;true&quot; />
                  `" />
              </CardContent>
            </Card>
            <!-- 기본 -->
            <Card>
              <CardHeader>
                <div class="flex items-center justify-between">
                  <div>
                    <CardTitle>Textarea</CardTitle>
                    <CardDescription>Textarea 커스텀 ui</CardDescription>
                  </div>
                  <div>
                    <SwitchSquare
                      class="content-end"
                      :options="[
                        { value: 'preview', label: 'Preview', icon: 'visibility' },
                        { value: 'code', label: 'Code', icon: 'integration_instructions' },
                      ]"
                      v-model="previewState['vue-textarea']" />
                  </div>
                </div>
              </CardHeader>
              <CardContent v-show="previewState['vue-textarea'] == 'preview'">
                <!-- textarea -->
                <div class="wrap mt-16">
                  <Label for="textId_1">textarea 확인</Label>
                  <Textarea id="textId_1" placeholder="문자를 작성해주세요." />
                </div>
                <div class="wrap mt-16">
                  <Label for="textId_2">textarea invalid 확인</Label>
                  <Textarea
                    id="textId_2"
                    placeholder="문자를 작성해주세요."
                    :invalid="true"
                    invalid-message="문자를 확인해주세요." />
                </div>
                <div class="wrap mt-16">
                  <Label for="textId_2">textarea class</Label>
                  <Textarea
                    id="textId_2"
                    class="h-100 text-lg"
                    placeholder="문자를 작성해주세요." />
                </div>
              </CardContent>
              <CardContent v-show="previewState['vue-textarea'] == 'code'">
                <CodeBlock
                  :code="`
<!-- textarea -->
<div class=&quot;wrap mt-16&quot;>
  <Label for=&quot;textId_1&quot;>textarea 확인</Label>
  <Textarea id=&quot;textId_1&quot; placeholder=&quot;문자를 작성해주세요.&quot; />
</div>

<!-- textarea invalid -->
<div class=&quot;wrap mt-16&quot;>
  <Label for=&quot;textId_2&quot;>textarea invalid 확인</Label>
  <Textarea
    id=&quot;textId_2&quot;
    placeholder=&quot;문자를 작성해주세요.&quot;
    :invalid=&quot;true&quot;
    invalid-message=&quot;문자를 확인해주세요.&quot; />
</div>

<!-- textarea class -->
<div class=&quot;wrap mt-16&quot;>
  <Label for=&quot;textId_2&quot;>textarea class</Label>
  <Textarea
    id=&quot;textId_2&quot;
    class=&quot;h-100 text-lg&quot;
    placeholder=&quot;문자를 작성해주세요.&quot; />
</div>
                  `" />
              </CardContent>
            </Card>
          </div>
        </section>

        <section id="timepickerSection" class="mb-24 rounded-md bg-white p-16">
          <h3 class="text-24 font-medium text-gray-800">Timepicker</h3>
          <div class="content mt-16">
            <!-- 기본 -->
            <Card>
              <CardHeader>
                <div class="flex items-center justify-between">
                  <div>
                    <CardTitle>Timepicker</CardTitle>
                    <CardDescription>Timepicker 커스텀 ui</CardDescription>
                  </div>
                  <div>
                    <SwitchSquare
                      class="content-end"
                      :options="[
                        { value: 'preview', label: 'Preview', icon: 'visibility' },
                        { value: 'code', label: 'Code', icon: 'integration_instructions' },
                      ]"
                      v-model="previewState['vue-timepicker']" />
                  </div>
                </div>
              </CardHeader>
              <CardContent v-show="previewState['vue-timepicker'] == 'preview'">
                <div class="mb-16 grid grid-cols-4 gap-16">
                  <div>
                    <Input type="time" v-model="time" />
                  </div>
                  <div>
                    <Label for="timeId_1">timepicker 기본 (ko)</Label>
                    <Timepicker v-model="time" />
                    <p class="mt-4 text-12 text-muted-foreground">값: {{ time }}</p>
                  </div>
                  <div>
                    <Label for="timeId_1">timepicker invalid</Label>
                    <Timepicker :invalid="true" invalid-message="필수값 입니다." v-model="time" />
                    <p class="mt-4 text-12 text-muted-foreground">값: {{ time }}</p>
                  </div>
                </div>
                <div class="grid grid-cols-4 gap-16">
                  <div>
                    <Label for="timeId_1">timepicker (en + sm + minuteStep)</Label>
                    <Timepicker size="sm" meridiem="en" :minute-step="10" v-model="time" />
                    <p class="mt-4 text-12 text-muted-foreground">값: {{ time }}</p>
                  </div>
                  <div>
                    <Label for="timeId_1">timepicker (en + lg + minuteStep)</Label>
                    <Timepicker size="lg" meridiem="EN" :minute-step="30" v-model="time" />
                    <p class="mt-4 text-12 text-muted-foreground">값: {{ time }}</p>
                  </div>
                  <div>
                    <Label for="timeId_1">timepicker (fulltime)</Label>
                    <Timepicker :fulltime="true" v-model="time24" />
                    <p class="mt-4 text-12 text-muted-foreground">값: {{ time24 }}</p>
                  </div>
                </div>
              </CardContent>
              <CardContent v-show="previewState['vue-timepicker'] == 'code'">
                <CodeBlock
                  :code="`
<!-- 기본 -->
<Label for=&quot;timeId_1&quot;>timepicker 기본 (ko)</Label>
<Timepicker v-model=&quot;time&quot; />
<p class=&quot;mt-4 text-12 text-muted-foreground&quot;>값: {{ time }}</p>
<!-- invalid -->
<Timepicker v-model=&quot;time&quot; :invalid=&quot;true&quot; />
<p class=&quot;mt-4 text-12 text-muted-foreground&quot;>값: {{ time }}</p>

<!-- size + meridiem -->
<Label for=&quot;timeId_1&quot;>timepicker (en + sm + minuteStep)</Label>
<Timepicker v-model=&quot;time&quot; size=&quot;sm&quot; :minuteStep=&quot;10&quot; meridiem=&quot;en&quot; />
<p class=&quot;mt-4 text-12 text-muted-foreground&quot;>값: {{ time }}</p>

<Label for=&quot;timeId_1&quot;>timepicker (en + lg + minuteStep)</Label>
<Timepicker v-model=&quot;time&quot; size=&quot;lg&quot; :minuteStep=&quot;30&quot; meridiem=&quot;EN&quot; />
<p class=&quot;mt-4 text-12 text-muted-foreground&quot;>값: {{ time }}</p>

<!-- 12/24 시 설정 - fulltime -->
<Label for=&quot;timeId_1&quot;>timepicker (fulltime)</Label>
<Timepicker v-model=&quot;time24&quot; :fulltime=&quot;true&quot; />
<p class=&quot;mt-4 text-12 text-muted-foreground&quot;>값: {{ time24 }}</p>
                `" />
              </CardContent>
            </Card>
          </div>
        </section>

        <section id="checkboxSection" class="mb-24 rounded-md bg-white p-16">
          <h3 class="text-24 font-medium text-gray-800">Check & Radio</h3>
          <div class="content mt-16">
            <!-- 기본 -->
            <Card class="mb-24">
              <CardHeader>
                <div class="flex items-center justify-between">
                  <div>
                    <CardTitle>Checkbox Buttons</CardTitle>
                    <CardDescription>Checkbox 기본 ui</CardDescription>
                  </div>
                  <div>
                    <SwitchSquare
                      class="content-end"
                      :options="[
                        { value: 'preview', label: 'Preview', icon: 'visibility' },
                        { value: 'code', label: 'Code', icon: 'integration_instructions' },
                      ]"
                      v-model="previewState['vue-checkbox']" />
                  </div>
                </div>
              </CardHeader>
              <CardContent v-show="previewState['vue-checkbox'] == 'preview'">
                <!-- Checkbox 단일 -->
                <div class="mb-20 flex gap-20">
                  <Checkbox id="checkboxOnlySm" size="sm" value="checkboxOnlySm" />
                  <Checkbox id="checkboxOnly" value="checkboxOnly" />
                  <Checkbox id="checkboxOnlyLg" size="lg" value="checkboxOnlyLg" />
                </div>
                <!-- Checkbox 묶음 -->
                <div class="mb-20 flex gap-20">
                  <CheckboxField>
                    <template #checkbox>
                      <Checkbox id="checkboxWrap_1" name="checkboxWrap" value="checkbox wrap 1" />
                    </template>
                    <label for="checkboxWrap_1">checkbox 1</label>
                  </CheckboxField>
                  <CheckboxField>
                    <template #checkbox>
                      <Checkbox id="checkboxWrap_2" name="checkboxWrap" value="checkbox wrap 2" />
                    </template>
                    <label for="checkboxWrap_2">checkbox 2</label>
                  </CheckboxField>
                  <CheckboxField>
                    <template #checkbox>
                      <Checkbox id="checkboxWrap_3" name="checkboxWrap" value="checkbox wrap 3" />
                    </template>
                    <label for="checkboxWrap_3">checkbox 3</label>
                  </CheckboxField>
                </div>

                <div class="flex flex-col gap-6">
                  <!-- 기본: 단일 라벨 -->
                  <CheckboxField>
                    <template #checkbox>
                      <Checkbox id="field_1" value="checkbox value 1" />
                    </template>
                    <label for="field_1">기본 단일 라벨</label>
                  </CheckboxField>

                  <!-- 라벨 + 설명 (멀티라인) -->
                  <CheckboxField>
                    <template #checkbox>
                      <Checkbox id="field_2" :default-value="true" value="checkbox value 2" />
                    </template>
                    <div>
                      <label for="field_2">이용약관 동의</label>
                      <p class="text-[12px] font-medium text-gray-400">
                        체크박스를 클릭하면 이용약관 및 개인정보 처리방침에 동의하게 됩니다.
                      </p>
                    </div>
                  </CheckboxField>

                  <!-- sm size -->
                  <CheckboxField size="sm">
                    <template #checkbox>
                      <Checkbox id="field_3" value="checkbox value 3" />
                    </template>
                    <label for="field_3">sm size checkbox</label>
                  </CheckboxField>

                  <!-- lg size -->
                  <CheckboxField size="lg">
                    <template #checkbox>
                      <Checkbox id="field_4" size="lg" value="checkbox value 4" />
                    </template>
                    <label for="field_4">lg size checkbox</label>
                  </CheckboxField>

                  <!-- 큰 폰트 라벨 + 작은 설명 혼합 -->
                  <CheckboxField size="lg">
                    <template #checkbox>
                      <Checkbox id="field_5" size="lg" value="checkbox value 5" />
                    </template>
                    <div class="grid gap-1">
                      <label for="field_5" class="font-semibold">큰 제목 텍스트</label>
                      <p class="text-sm text-muted-foreground">
                        폰트 크기가 달라도 항상 첫 번째 줄에 정렬됩니다.
                      </p>
                    </div>
                  </CheckboxField>

                  <!-- invalid -->
                  <CheckboxField :invalid="true" invalid-message="필수 체크박스 입니다.">
                    <template #checkbox>
                      <Checkbox id="field_6" value="checkbox value 6" />
                    </template>
                    <div>
                      <label for="field_6">이용약관 동의</label>
                    </div>
                  </CheckboxField>
                </div>
              </CardContent>
              <CardContent v-show="previewState['vue-checkbox'] == 'code'">
                <CodeBlock
                  :code="`
<!-- Checkbox 단일 -->
<div class=&quot;mb-20 flex gap-20&quot;>
  <Checkbox id=&quot;checkboxOnlySm&quot; size=&quot;sm&quot; value=&quot;checkboxOnlySm&quot; />
  <Checkbox id=&quot;checkboxOnly&quot; value=&quot;checkboxOnly&quot; />
  <Checkbox id=&quot;checkboxOnlyLg&quot; size=&quot;lg&quot; value=&quot;checkboxOnlyLg&quot; />
</div>

<!-- 기본: 단일 라벨 -->
<CheckboxField>
  <template #checkbox>
    <Checkbox id=&quot;field_1&quot; value=&quot;checkbox value 1&quot; />
  </template>
  <label for=&quot;field_1&quot;>기본 단일 라벨</label>
</CheckboxField>

<!-- 라벨 + 설명 (멀티라인) -->
<CheckboxField>
  <template #checkbox>
    <Checkbox id=&quot;field_2&quot; :default-value=&quot;true&quot; value=&quot;checkbox value 2&quot; />
  </template>
  <div>
    <label for=&quot;field_2&quot;>이용약관 동의</label>
    <p class=&quot;text-[12px] font-medium text-gray-400&quot;>
      체크박스를 클릭하면 이용약관 및 개인정보 처리방침에 동의하게 됩니다.
    </p>
  </div>
</CheckboxField>

<!-- sm size -->
<CheckboxField size=&quot;sm&quot;>
  <template #checkbox>
    <Checkbox id=&quot;field_3&quot; value=&quot;checkbox value 3&quot; />
  </template>
  <label for=&quot;field_3&quot;>sm size checkbox</label>
</CheckboxField>

<!-- lg size -->
<CheckboxField size=&quot;lg&quot;>
  <template #checkbox>
    <Checkbox id=&quot;field_4&quot; size=&quot;lg&quot; value=&quot;checkbox value 4&quot; />
  </template>
  <label for=&quot;field_4&quot;>lg size checkbox</label>
</CheckboxField>

<!-- 큰 폰트 라벨 + 작은 설명 혼합 -->
<CheckboxField size=&quot;lg&quot;>
  <template #checkbox>
    <Checkbox id=&quot;field_5&quot; size=&quot;lg&quot; value=&quot;checkbox value 5&quot; />
  </template>
  <div class=&quot;grid gap-1&quot;>
    <label for=&quot;field_5&quot; class=&quot;font-semibold&quot;>큰 제목 텍스트</label>
    <p class=&quot;text-sm text-muted-foreground&quot;>
      폰트 크기가 달라도 항상 첫 번째 줄에 정렬됩니다.
    </p>
  </div>
</CheckboxField>

<!-- invalid -->
<CheckboxField :invalid=&quot;true&quot; invalid-message=&quot;필수 체크박스 입니다.&quot;>
  <template #checkbox>
    <Checkbox id=&quot;field_6&quot; value=&quot;checkbox value 6&quot; />
  </template>
  <div>
    <label for=&quot;field_6&quot;>이용약관 동의</label>
  </div>
</CheckboxField>
                  `" />
              </CardContent>
            </Card>
            <!-- radio -->
            <Card class="mb-24">
              <CardHeader>
                <div class="flex items-center justify-between">
                  <div>
                    <CardTitle>Radio Size</CardTitle>
                    <CardDescription>Radio Size ui</CardDescription>
                  </div>
                  <div>
                    <SwitchSquare
                      class="content-end"
                      :options="[
                        { value: 'preview', label: 'Preview', icon: 'visibility' },
                        { value: 'code', label: 'Code', icon: 'integration_instructions' },
                      ]"
                      v-model="previewState['vue-radio-size']" />
                  </div>
                </div>
              </CardHeader>
              <CardContent v-show="previewState['vue-radio-size'] == 'preview'">
                <!-- Radio 단일 -->
                <RadioGroup default-value="">
                  <div class="mb-20 flex gap-20">
                    <RadioGroupItem id="radioOnlySm" size="sm" value="radioOnlySm" />
                    <RadioGroupItem id="radioOnly" value="radioOnly" />
                    <RadioGroupItem id="radioOnlyLg" size="lg" value="radioOnlyLg" />
                  </div>
                </RadioGroup>

                <RadioGroup default-value="comfortable">
                  <div class="flex flex-col gap-6">
                    <!-- 기본: 단일 라벨 -->
                    <RadioGroupField>
                      <template #radio>
                        <RadioGroupItem id="r1" value="radio value 1" />
                      </template>
                      <label for="r1">Default</label>
                    </RadioGroupField>

                    <!-- 선택된 상태 + 설명 (멀티라인) -->
                    <RadioGroupField>
                      <template #radio>
                        <RadioGroupItem id="r2" value="radio value 2" />
                      </template>
                      <div class="">
                        <label for="r2">Comfortable</label>
                        <p class="text-[12px] font-medium text-gray-400">
                          적당한 여백으로 읽기 편한 레이아웃을 제공합니다.
                        </p>
                      </div>
                    </RadioGroupField>

                    <!-- sm size radio -->
                    <RadioGroupField size="sm">
                      <template #radio>
                        <RadioGroupItem id="r3" value="radio value 3" />
                      </template>
                      <label for="r3">sm size radio</label>
                    </RadioGroupField>

                    <!-- lg size radio -->
                    <RadioGroupField size="lg">
                      <template #radio>
                        <RadioGroupItem id="r4" value="radio value 4" />
                      </template>
                      <div class="grid gap-1">
                        <label for="r4">큰 사이즈 - lg size radio</label>
                      </div>
                    </RadioGroupField>

                    <!-- 큰 폰트 + 작은 설명 혼합 -->
                    <RadioGroupField size="lg">
                      <template #radio>
                        <RadioGroupItem id="r5" value="radio value 5" />
                      </template>
                      <div class="grid gap-1">
                        <label for="r5" class="font-semibold">Spacious</label>
                        <p class="text-sm text-muted-foreground">
                          폰트 크기가 달라도 항상 첫 번째 줄에 정렬됩니다.
                        </p>
                      </div>
                    </RadioGroupField>
                  </div>
                </RadioGroup>
              </CardContent>
              <CardContent v-show="previewState['vue-radio-size'] == 'code'">
                <CodeBlock
                  :code="`
<!-- Radio 단일 -->
<RadioGroup default-value=&quot;&quot;>
  <div class=&quot;mb-20 flex gap-20&quot;>
    <RadioGroupItem id=&quot;radioOnlySm&quot; name=&quot;&quot; size=&quot;sm&quot; value=&quot;radioOnlySm&quot; />
    <RadioGroupItem id=&quot;radioOnly&quot; value=&quot;radioOnly&quot; />
    <RadioGroupItem id=&quot;radioOnlyLg&quot; size=&quot;lg&quot; value=&quot;radioOnlyLg&quot; />
  </div>
</RadioGroup>

<!-- Radio + Label -->
<RadioGroup default-value=&quot;comfortable&quot;>
  <div class=&quot;flex flex-col gap-6&quot;>
    <!-- 기본: 단일 라벨 -->
    <RadioGroupField>
      <template #radio>
        <RadioGroupItem id=&quot;r1&quot; value=&quot;radio value 1&quot; />
      </template>
      <label for=&quot;r1&quot;>Default</label>
    </RadioGroupField>

    <!-- 선택된 상태 + 설명 (멀티라인) -->
    <RadioGroupField>
      <template #radio>
        <RadioGroupItem id=&quot;r2&quot; value=&quot;radio value 2&quot; />
      </template>
      <div class=&quot;&quot;>
        <label for=&quot;r2&quot;>Comfortable</label>
        <p class=&quot;text-[12px] font-medium text-gray-400&quot;>
          적당한 여백으로 읽기 편한 레이아웃을 제공합니다.
        </p>
      </div>
    </RadioGroupField>

    <!-- sm size radio -->
    <RadioGroupField size=&quot;sm&quot;>
      <template #radio>
        <RadioGroupItem id=&quot;r3&quot; value=&quot;radio value 3&quot; />
      </template>
      <label for=&quot;r3&quot;>sm size radio</label>
    </RadioGroupField>

    <!-- lg size radio -->
    <RadioGroupField size=&quot;lg&quot;>
      <template #radio>
        <RadioGroupItem id=&quot;r4&quot; value=&quot;radio value 4&quot; />
      </template>
      <div class=&quot;grid gap-1&quot;>
        <label for=&quot;r4&quot;>큰 사이즈 - lg size radio</label>
      </div>
    </RadioGroupField>

    <!-- 큰 폰트 + 작은 설명 혼합 -->
    <RadioGroupField size=&quot;lg&quot;>
      <template #radio>
        <RadioGroupItem id=&quot;r5&quot; value=&quot;radio value 5&quot; />
      </template>
      <div class=&quot;grid gap-1&quot;>
        <label for=&quot;r5&quot; class=&quot;font-semibold&quot;>Spacious</label>
        <p class=&quot;text-sm text-muted-foreground&quot;>
          폰트 크기가 달라도 항상 첫 번째 줄에 정렬됩니다.
        </p>
      </div>
    </RadioGroupField>
  </div>
</RadioGroup>
                `" />
              </CardContent>
            </Card>
            <Card class="mb-24">
              <CardHeader>
                <div class="flex items-center justify-between">
                  <div>
                    <CardTitle>Radio Size + invalid</CardTitle>
                    <CardDescription>Radio 크기별 invalid ui</CardDescription>
                  </div>
                  <div>
                    <SwitchSquare
                      class="content-end"
                      :options="[
                        { value: 'preview', label: 'Preview', icon: 'visibility' },
                        { value: 'code', label: 'Code', icon: 'integration_instructions' },
                      ]"
                      v-model="previewState['vue-radio-size-invalid']" />
                  </div>
                </div>
              </CardHeader>
              <CardContent v-show="previewState['vue-radio-size-invalid'] == 'preview'">
                <RadioGroup :invalid="true" invalid-message="필수 라디오 입니다." class="mb-8">
                  <!-- 기본: 단일 라벨 -->
                  <RadioGroupField>
                    <template #radio>
                      <RadioGroupItem id="radioValid_1" value="radio value 1" />
                    </template>
                    <label for="radioValid_1">Default</label>
                  </RadioGroupField>
                </RadioGroup>
                <RadioGroup
                  :invalid="true"
                  invalid-message="필수 라디오 입니다."
                  class="mb-8"
                  size="sm">
                  <!-- sm size radio -->
                  <RadioGroupField>
                    <template #radio>
                      <RadioGroupItem id="radioValid_2" value="radio value 2" />
                    </template>
                    <label for="radioValid_2">sm size radio</label>
                  </RadioGroupField>
                </RadioGroup>
                <RadioGroup
                  :invalid="true"
                  invalid-message="필수 라디오 입니다."
                  class="mb-8"
                  size="lg">
                  <RadioGroupField>
                    <template #radio>
                      <RadioGroupItem id="radioValid_3" value="radio value 3" />
                    </template>
                    <div class="grid gap-1">
                      <label for="radioValid_3">큰 사이즈 - lg size radio</label>
                    </div>
                  </RadioGroupField>
                </RadioGroup>

                <p class="mt-16">radio horizontal</p>
                <RadioGroup :invalid="true" invalid-message="필수 라디오 입니다.">
                  <div class="flex gap-x-16">
                    <RadioGroupField>
                      <template #radio>
                        <RadioGroupItem id="r2_1" value="default" />
                      </template>
                      <label for="r2_1">radio 1</label>
                    </RadioGroupField>

                    <RadioGroupField>
                      <template #radio>
                        <RadioGroupItem id="r2_2" value="comfortable" />
                      </template>
                      <div class="">
                        <label for="r2_2">radio 2</label>
                      </div>
                    </RadioGroupField>

                    <RadioGroupField>
                      <template #radio>
                        <RadioGroupItem id="r2_3" value="compact" />
                      </template>
                      <label for="r2_3">radio 3</label>
                    </RadioGroupField>
                  </div>
                </RadioGroup>
              </CardContent>
              <CardContent v-show="previewState['vue-radio-size-invalid'] == 'code'">
                <CodeBlock
                  :code="`
<RadioGroup :invalid=&quot;true&quot; invalidMessage=&quot;필수 라디오 입니다.&quot; class=&quot;mb-8&quot;>
  <!-- 기본: 단일 라벨 -->
  <RadioGroupField>
    <template #radio>
      <RadioGroupItem id=&quot;radioValid_1&quot; value=&quot;radio value 1&quot; />
    </template>
    <label for=&quot;radioValid_1&quot;>Default</label>
  </RadioGroupField>
</RadioGroup>
<RadioGroup
  :invalid=&quot;true&quot;
  invalidMessage=&quot;필수 라디오 입니다.&quot;
  class=&quot;mb-8&quot;
  size=&quot;sm&quot;>
  <!-- sm size radio -->
  <RadioGroupField>
    <template #radio>
      <RadioGroupItem id=&quot;rradioValid_2&quot; value=&quot;radio value 2&quot; />
    </template>
    <label for=&quot;radioValid_2&quot;>sm size radio</label>
  </RadioGroupField>
</RadioGroup>
<RadioGroup
  :invalid=&quot;true&quot;
  invalidMessage=&quot;필수 라디오 입니다.&quot;
  class=&quot;mb-8&quot;
  size=&quot;lg&quot;>
  <RadioGroupField>
    <template #radio>
      <RadioGroupItem id=&quot;radioValid_3&quot; value=&quot;radio value 3&quot; />
    </template>
    <div class=&quot;grid gap-1&quot;>
      <label for=&quot;radioValid_3&quot;>큰 사이즈 - lg size radio</label>
    </div>
  </RadioGroupField>
</RadioGroup>

<!-- radio horizontal -->
<RadioGroup :invalid=&quot;true&quot; invalidMessage=&quot;필수 라디오 입니다.&quot;>
  <div class=&quot;flex gap-x-16&quot;>
    <RadioGroupField>
      <template #radio>
        <RadioGroupItem id=&quot;r2_1&quot; value=&quot;default&quot; />
      </template>
      <label for=&quot;r2_1&quot;>radio 1</label>
    </RadioGroupField>

    <RadioGroupField>
      <template #radio>
        <RadioGroupItem id=&quot;r2_2&quot; value=&quot;comfortable&quot; />
      </template>
      <div class=&quot;&quot;>
        <label for=&quot;r2_2&quot;>radio 2</label>
      </div>
    </RadioGroupField>

    <RadioGroupField>
      <template #radio>
        <RadioGroupItem id=&quot;r2_3&quot; value=&quot;compact&quot; />
      </template>
      <label for=&quot;r2_3&quot;>radio 3</label>
    </RadioGroupField>
  </div>
</RadioGroup>
                `" />
              </CardContent>
            </Card>
            <Card class="mb-24">
              <CardHeader>
                <div class="flex items-center justify-between">
                  <div>
                    <CardTitle>Radio Buttons</CardTitle>
                    <CardDescription>Radio Buttons ui</CardDescription>
                  </div>
                  <div>
                    <SwitchSquare
                      class="content-end"
                      :options="[
                        { value: 'preview', label: 'Preview', icon: 'visibility' },
                        { value: 'code', label: 'Code', icon: 'integration_instructions' },
                      ]"
                      v-model="previewState['vue-radio-button']" />
                  </div>
                </div>
              </CardHeader>
              <CardContent v-show="previewState['vue-radio-button'] == 'preview'">
                <div class="flex flex-col gap-24">
                  <!-- 가로 나열 -->
                  <RadioGroup default-value="b2" class="grid grid-cols-3 gap-8">
                    <RadioGroupItemBlock value="b1">Default</RadioGroupItemBlock>
                    <RadioGroupItemBlock value="b2" disabled>Disabled</RadioGroupItemBlock>
                    <RadioGroupItemBlock value="b3">Compact</RadioGroupItemBlock>
                  </RadioGroup>

                  <!-- 세로 나열 -->
                  <RadioGroup default-value="c2" class="flex flex-col gap-4">
                    <RadioGroupItemBlock value="c1">옵션 A</RadioGroupItemBlock>
                    <RadioGroupItemBlock value="c2">옵션 B (기본 선택)</RadioGroupItemBlock>
                    <RadioGroupItemBlock value="c3">옵션 C</RadioGroupItemBlock>
                  </RadioGroup>

                  <!-- size 변경 - sm -->
                  <RadioGroup default-value="d1" class="flex flex-row gap-8" size="sm">
                    <RadioGroupItemBlock value="d1">sm size</RadioGroupItemBlock>
                    <RadioGroupItemBlock value="d2">radio button</RadioGroupItemBlock>
                    <RadioGroupItemBlock value="d3">style ui</RadioGroupItemBlock>
                  </RadioGroup>
                  <!-- size 변경 - lg -->
                  <RadioGroup default-value="dd1" class="flex flex-row gap-8" size="lg">
                    <RadioGroupItemBlock value="dd1">lg size</RadioGroupItemBlock>
                    <RadioGroupItemBlock value="dd2">radio button</RadioGroupItemBlock>
                    <RadioGroupItemBlock value="dd3">style ui</RadioGroupItemBlock>
                  </RadioGroup>
                </div>
              </CardContent>
              <CardContent v-show="previewState['vue-radio-button'] == 'code'">
                <CodeBlock
                  :code="`
<!-- 가로 나열 -->
<RadioGroup default-value=&quot;b2&quot; class=&quot;grid grid-cols-3 gap-8&quot;>
  <RadioGroupItemBlock value=&quot;b1&quot;>Default</RadioGroupItemBlock>
  <RadioGroupItemBlock value=&quot;b2&quot; disabled>Disabled</RadioGroupItemBlock>
  <RadioGroupItemBlock value=&quot;b3&quot;>Compact</RadioGroupItemBlock>
</RadioGroup>

<!-- 세로 나열 -->
<RadioGroup default-value=&quot;c2&quot; class=&quot;flex flex-col gap-4&quot;>
  <RadioGroupItemBlock value=&quot;c1&quot;>옵션 A</RadioGroupItemBlock>
  <RadioGroupItemBlock value=&quot;c2&quot;>옵션 B (기본 선택)</RadioGroupItemBlock>
  <RadioGroupItemBlock value=&quot;c3&quot;>옵션 C</RadioGroupItemBlock>
</RadioGroup>

<!-- size 변경 - sm -->
<RadioGroup default-value=&quot;d1&quot; class=&quot;flex flex-row gap-8&quot; size=&quot;sm&quot;>
  <RadioGroupItemBlock value=&quot;d1&quot;>sm size</RadioGroupItemBlock>
  <RadioGroupItemBlock value=&quot;d2&quot;>radio button</RadioGroupItemBlock>
  <RadioGroupItemBlock value=&quot;d3&quot;>style ui</RadioGroupItemBlock>
</RadioGroup>
<!-- size 변경 - lg -->
<RadioGroup default-value=&quot;dd1&quot; class=&quot;flex flex-row gap-8&quot; size=&quot;lg&quot;>
  <RadioGroupItemBlock value=&quot;dd1&quot;>lg size</RadioGroupItemBlock>
  <RadioGroupItemBlock value=&quot;dd2&quot;>radio button</RadioGroupItemBlock>
  <RadioGroupItemBlock value=&quot;dd3&quot;>style ui</RadioGroupItemBlock>
</RadioGroup>
                `" />
              </CardContent>
            </Card>
          </div>
        </section>

        <section id="selectSection" class="mb-24 rounded-md bg-white p-16">
          <h3 class="text-24 font-medium text-gray-800">Select</h3>
          <div class="content mt-16">
            <!-- 1. 기본 옵션 배열만 사용 -->
            <Card class="mb-24">
              <CardHeader>
                <div class="flex items-center justify-between">
                  <div>
                    <CardTitle>VueSelect</CardTitle>
                    <CardDescription>일반 옵션 배열을 사용하는 기본 예시</CardDescription>
                  </div>
                  <div>
                    <SwitchSquare
                      class="content-end"
                      :options="[
                        { value: 'preview', label: 'Preview', icon: 'visibility' },
                        { value: 'code', label: 'Code', icon: 'integration_instructions' },
                      ]"
                      v-model="previewState['vue-select']" />
                  </div>
                </div>
              </CardHeader>
              <CardContent v-show="previewState['vue-select'] == 'preview'">
                <div class="grid grid-cols-2 gap-16">
                  <div>
                    <Label for="selectId_1">VueSelect 확인</Label>
                    <VueSelect id="selectId_1" :options="schoolOptions" v-model="selectedSchool" />
                    <p class="mt-8 text-sm text-gray-500">선택값: {{ selectedSchool }}</p>
                  </div>
                  <div>
                    <Label for="selectId_1_1">VueSelect invalid 확인</Label>
                    <VueSelect
                      id="selectId_1_1"
                      :options="schoolOptions"
                      :invalid="true"
                      invalid-message="select를 확인해주세요."
                      v-model="selectedSchool" />
                  </div>
                </div>
              </CardContent>
              <CardContent v-show="previewState['vue-select'] == 'code'">
                <CodeBlock
                  :code="`
<!-- VueSelect -->
<VueSelect
  id=&quot;selectId_1&quot;
  :options=&quot;schoolOptions&quot;
  v-model=&quot;selectedSchool&quot; />
<p class=&quot;mt-8 text-sm text-gray-500&quot;>선택값: {{ selectedSchool }}</p>

<!-- VueSelect invalid -->
<VueSelect
  id=&quot;selectId_1&quot;
  :options=&quot;schoolOptions&quot;
  v-model=&quot;selectedSchool&quot;
  :invalid=&quot;true&quot;
  invalidMessage=&quot;select를 확인해주세요.&quot; />

<script setup lang=&quot;ts&quot;>
  // VueSelect 기본 예시
  const schoolOptions = [
    { label: '서울대학교', value: 'snu' },
    { label: '연세대학교', value: 'yonsei' },
    { label: '고려대학교', value: 'korea' },
    { label: '성균관대학교', value: 'skku' },
    { label: '한양대학교', value: 'hanyang' },
  ];
</script>
`" />
              </CardContent>
            </Card>

            <!-- 2. Ajax (비동기) 옵션 로딩 -->
            <Card class="mb-24">
              <CardHeader>
                <div class="flex items-center justify-between">
                  <div>
                    <CardTitle>VueSelect - Ajax + 무한 스크롤</CardTitle>
                    <CardDescription>
                      API로 옵션을 불러오고, 스크롤 시 10개씩 추가 로딩
                    </CardDescription>
                  </div>
                  <div>
                    <SwitchSquare
                      class="content-end"
                      :options="[
                        { value: 'preview', label: 'Preview', icon: 'visibility' },
                        { value: 'code', label: 'Code', icon: 'integration_instructions' },
                      ]"
                      v-model="previewState['vue-select-ajax']" />
                  </div>
                </div>
              </CardHeader>
              <CardContent v-show="previewState['vue-select-ajax'] == 'preview'">
                <div class="w-[50%]">
                  <VueSelect
                    id="selectId_2"
                    :options="repoOptions"
                    :filterable="false"
                    placeholder="GitHub 저장소를 검색하세요"
                    @search="onRepoSearch"
                    v-model="selectedRepo">
                    <template #no-options="{ search }">
                      <span class="text-sm text-muted-foreground">
                        <template v-if="search">
                          "{{ search }}"에 해당하는 저장소가 없습니다.
                        </template>
                        <template v-else>검색어를 입력하세요.</template>
                      </span>
                    </template>
                  </VueSelect>
                </div>
                <p class="mt-8 text-sm text-gray-500">
                  선택값: {{ selectedRepo?.label ?? '없음' }}
                </p>
              </CardContent>
              <CardContent v-show="previewState['vue-select-ajax'] == 'code'">
                <CodeBlock
                  :code="`
<!-- Ajax (비동기) 옵션 로딩 -->
<VueSelect
  id=&quot;selectId_2&quot;
  :options=&quot;repoOptions&quot;
  :filterable=&quot;false&quot;
  placeholder=&quot;GitHub 저장소를 검색하세요&quot;
  v-model=&quot;selectedRepo&quot;
  @search=&quot;onRepoSearch&quot;>
  <template #no-options=&quot;{ search }&quot;>
    <span class=&quot;text-sm text-muted-foreground&quot;>
      <template v-if=&quot;search&quot;>
        &quot;{{ search }}&quot;에 해당하는 저장소가 없습니다.
      </template>
      <template v-else>검색어를 입력하세요.</template>
    </span>
  </template>
</VueSelect>
<p class=&quot;mt-8 text-sm text-gray-500&quot;>
  선택값: {{ selectedRepo?.label ?? '없음' }}
</p>

<script setup lang=&quot;ts&quot;>
// VueSelect Ajax 예시 (GitHub API)
type RepoOption = { label: string; value: number };

const repoOptions = ref<RepoOption[]>([]);
const selectedRepo = ref<RepoOption | null>(null);

let repoSearchTimer: ReturnType<typeof setTimeout> | null = null;
const onRepoSearch = (search: string, loading: (v: boolean) => void) => {
  if (!search.length) {
    repoOptions.value = [];
    return;
  }
  loading(true);
  if (repoSearchTimer) clearTimeout(repoSearchTimer);
  repoSearchTimer = setTimeout(async () => {
    try {
      const res = await $fetch<{ items: Array<{ id: number; full_name: string }> }>(
        &quot;https://api.github.com/search/repositories?q=&#36; {encodeURIComponent(search)}&quot;
      );
      repoOptions.value = (res.items ?? []).map(item => ({
        label: item.full_name,
        value: item.id,
      }));
    } finally {
      loading(false);
    }
  }, 350);
};
<script>

                `" />
              </CardContent>
            </Card>

            <!-- 3. 사이즈 -->
            <Card class="mb-24">
              <CardHeader>
                <div class="flex items-center justify-between">
                  <div>
                    <CardTitle>VueSelect - size</CardTitle>
                    <CardDescription>VueSelect size + seleted-count 표시</CardDescription>
                  </div>
                  <div>
                    <SwitchSquare
                      class="content-end"
                      :options="[
                        { value: 'preview', label: 'Preview', icon: 'visibility' },
                        { value: 'code', label: 'Code', icon: 'integration_instructions' },
                      ]"
                      v-model="previewState['vue-select-size']" />
                  </div>
                </div>
              </CardHeader>
              <CardContent v-show="previewState['vue-select-size'] == 'preview'">
                <div class="grid grid-cols-2 gap-16">
                  <div>
                    <Label for="vueSelectSize_1">sm 사이즈</Label>
                    <VueSelect
                      id="vueSelectSize_1"
                      :options="subjectOptions"
                      placeholder="과목을 선택하세요."
                      no-option-text=" 해당 과목이 없습니다."
                      size="sm"
                      multiple
                      v-model="selectedSubject" />
                  </div>
                  <div>
                    <Label for="vueSelectSize_1">sm 사이즈</Label>
                    <VueSelect
                      id="vueSelectSize_1"
                      :options="subjectOptions"
                      placeholder="과목을 선택하세요."
                      no-option-text=" 해당 과목이 없습니다."
                      seleted-count="true"
                      size="sm"
                      multiple
                      v-model="selectedSubject" />
                  </div>
                  <div>
                    <Label for="vueSelectSize_2">lg 사이즈</Label>
                    <VueSelect
                      id="vueSelectSize_2"
                      :options="subjectOptions"
                      placeholder="과목을 선택하세요."
                      no-option-text=" 해당 과목이 없습니다."
                      size="lg"
                      multiple
                      v-model="selectedSubject" />
                  </div>
                  <div>
                    <Label for="vueSelectSize_2">lg 사이즈</Label>
                    <VueSelect
                      id="vueSelectSize_2"
                      :options="subjectOptions"
                      placeholder="과목을 선택하세요."
                      no-option-text=" 해당 과목이 없습니다."
                      seleted-count="true"
                      size="lg"
                      multiple
                      v-model="selectedSubject" />
                  </div>
                </div>
              </CardContent>
              <CardContent v-show="previewState['vue-select-size'] == 'code'">
                <CodeBlock
                  :code="`
<!-- sm -->
<div>
  <Label for=&quot;vueSelectSize_1&quot;>sm 사이즈</Label>
  <VueSelect
    id=&quot;vueSelectSize_1&quot;
    :options=&quot;subjectOptions&quot;
    placeholder=&quot;과목을 선택하세요.&quot;
    no-option-text=&quot; 해당 과목이 없습니다.&quot;
    size=&quot;sm&quot;
    multiple
    v-model=&quot;selectedSubject&quot;></VueSelect>
</div>

<!-- sm + seleted-count -->
<div>
  <Label for=&quot;vueSelectSize_1&quot;>sm 사이즈</Label>
  <VueSelect
    id=&quot;vueSelectSize_1&quot;
    :options=&quot;subjectOptions&quot;
    placeholder=&quot;과목을 선택하세요.&quot;
    no-option-text=&quot; 해당 과목이 없습니다.&quot;
    seleted-count=&quot;true&quot;
    size=&quot;sm&quot;
    multiple
    v-model=&quot;selectedSubject&quot;></VueSelect>
</div>

<!-- lg -->
<div>
  <Label for=&quot;vueSelectSize_2&quot;>lg 사이즈</Label>
  <VueSelect
    id=&quot;vueSelectSize_2&quot;
    :options=&quot;subjectOptions&quot;
    placeholder=&quot;과목을 선택하세요.&quot;
    no-option-text=&quot; 해당 과목이 없습니다.&quot;
    size=&quot;lg&quot;
    multiple
    v-model=&quot;selectedSubject&quot;></VueSelect>
</div>

<!-- lg + seleted-count -->
<div>
  <Label for=&quot;vueSelectSize_2&quot;>lg 사이즈</Label>
  <VueSelect
    id=&quot;vueSelectSize_2&quot;
    :options=&quot;subjectOptions&quot;
    placeholder=&quot;과목을 선택하세요.&quot;
    no-option-text=&quot; 해당 과목이 없습니다.&quot;
    seleted-count=&quot;true&quot;
    size=&quot;lg&quot;
    multiple
    v-model=&quot;selectedSubject&quot;></VueSelect>
</div>

<script setup lang=&quot;ts&quot;>
// VueSelect 커스텀 템플릿 예시 (아이콘 포함)
const subjectOptions = [
  { label: '수학', value: 'math', icon: 'calculate', desc: '어려워...' },
  { label: '과학', value: 'science', icon: 'science', desc: '도 어려워...' },
  { label: '국어', value: 'korean', icon: 'menu_book' },
  {
    label:
      '영어 라벨을 길게 써봅시다 영어 라벨 template 텍스트 입니다. 옵션값이 길어지면 이렇게 보입니다.',
    value: 'english',
    icon: 'language',
  },
  { label: '체육', value: 'pe', icon: 'sports_soccer' },
];
const selectedSubject = ref([
  { label: '과학', value: 'science', icon: 'science', desc: '도 어려워...' },
  { label: '국어', value: 'korean', icon: 'menu_book' },
  {
    label:
      '영어 라벨을 길게 써봅시다 영어 라벨 template 텍스트 입니다. 옵션값이 길어지면 이렇게 보입니다.',
    value: 'english',
    icon: 'language',
  },
]);
<script>
                `" />
              </CardContent>
            </Card>

            <!-- 3. 커스텀 옵션 템플릿 (아이콘) -->
            <Card class="mb-24">
              <CardHeader>
                <div class="flex items-center justify-between">
                  <div>
                    <CardTitle>VueSelect - 커스텀 템플릿</CardTitle>
                    <CardDescription>아이콘이 포함 외 option 커스텀 템플릿 예시</CardDescription>
                  </div>
                  <div>
                    <SwitchSquare
                      class="content-end"
                      :options="[
                        { value: 'preview', label: 'Preview', icon: 'visibility' },
                        { value: 'code', label: 'Code', icon: 'integration_instructions' },
                      ]"
                      v-model="previewState['vue-select-2']" />
                  </div>
                </div>
              </CardHeader>
              <CardContent v-show="previewState['vue-select-2'] == 'preview'">
                <div class="grid grid-cols-2 gap-16">
                  <div>
                    <Label for="vueSelectId_1">sm 사이즈, multiple 옵션</Label>
                    <VueSelect
                      id="vueSelectId_1"
                      :options="subjectOptions"
                      placeholder="과목을 선택하세요."
                      no-option-text=" 해당 과목이 없습니다."
                      size="sm"
                      multiple
                      v-model="selectedSubject">
                      <template #option="option">
                        <div class="flex gap-8">
                          <span v-if="option.icon" class="flex h-[1lh] shrink-0 items-center">
                            <i class="material-icons block text-16 text-primary">
                              {{ option.icon }}
                            </i>
                          </span>
                          <span>{{ option.label }}</span>
                          <span v-if="option.desc" class="self-end text-[12px] text-gray-500">
                            {{ option.desc }}
                          </span>
                        </div>
                      </template>
                      <template #selected-option="option">
                        <div class="flex gap-6">
                          <span v-if="option.icon" class="flex h-[1lh] shrink-0 items-center">
                            <i class="material-icons block text-16 text-primary">
                              {{ option.icon }}
                            </i>
                          </span>
                          <span>{{ option.label }}</span>
                        </div>
                      </template>
                    </VueSelect>
                    <p class="mt-8 text-sm text-muted-foreground">선택값: {{ selectedSubject }}</p>
                  </div>
                  <div>
                    <Label for="vueSelectId_2">sm 사이즈, multiple 옵션, 갯수 표시</Label>
                    <VueSelect
                      id="vueSelectId_2"
                      :options="subjectOptions"
                      placeholder="과목을 선택하세요."
                      no-option-text=" 해당 과목이 없습니다."
                      seleted-count="true"
                      size="sm"
                      multiple
                      v-model="selectedSubject">
                      <template #option="option">
                        <div class="flex gap-8">
                          <span v-if="option.icon" class="flex h-[1lh] shrink-0 items-center">
                            <i class="material-icons text-md block leading-[1.4] text-primary">
                              {{ option.icon }}
                            </i>
                          </span>
                          <span>{{ option.label }}</span>
                          <span v-if="option.desc" class="self-end text-[12px] text-gray-500">
                            {{ option.desc }}
                          </span>
                        </div>
                      </template>
                      <template #selected-option="option">
                        <div class="flex gap-6">
                          <i
                            v-if="option.icon"
                            class="material-icons block h-fit text-16 leading-[1.4] text-primary">
                            {{ option.icon }}
                          </i>
                          <span>{{ option.label }}</span>
                        </div>
                      </template>
                    </VueSelect>
                    <p class="mt-8 text-sm text-muted-foreground">선택값: {{ selectedSubject }}</p>
                  </div>
                  <div>
                    <Label for="vueSelectId_2">lg 사이즈</Label>
                    <VueSelect
                      id="vueSelectId_2"
                      :options="subjectOptions"
                      placeholder="과목을 선택하세요."
                      no-option-text=" 해당 과목이 없습니다."
                      seleted-count="true"
                      size="lg"
                      multiple
                      v-model="selectedSubject">
                      <template #option="option">
                        <div class="flex gap-8">
                          <span v-if="option.icon" class="flex h-[1lh] shrink-0 items-center">
                            <i class="material-icons block text-lg leading-[1.4] text-primary">
                              {{ option.icon }}
                            </i>
                          </span>
                          <span>{{ option.label }}</span>
                          <span v-if="option.desc" class="self-end text-[12px] text-gray-500">
                            {{ option.desc }}
                          </span>
                        </div>
                      </template>
                      <template #selected-option="option">
                        <div class="flex gap-6">
                          <i
                            v-if="option.icon"
                            class="material-icons block h-fit text-16 leading-[1.4] text-primary">
                            {{ option.icon }}
                          </i>
                          <span>{{ option.label }}</span>
                        </div>
                      </template>
                    </VueSelect>
                    <p class="mt-8 text-sm text-muted-foreground">선택값: {{ selectedSubject }}</p>
                  </div>
                </div>
              </CardContent>
              <CardContent v-show="previewState['vue-select-2'] == 'code'">
                <CodeBlock
                  :code="`
<div>
  <Label for=&quot;vueSelectId_1&quot;>sm 사이즈, multiple 옵션</Label>
  <VueSelect
    id=&quot;vueSelectId_1&quot;
    :options=&quot;subjectOptions&quot;
    placeholder=&quot;과목을 선택하세요.&quot;
    no-option-text=&quot; 해당 과목이 없습니다.&quot;
    size=&quot;sm&quot;
    multiple
    v-model=&quot;selectedSubject&quot;>
    <template #option=&quot;option&quot;>
      <div class=&quot;flex gap-8&quot;>
        <span v-if=&quot;option.icon&quot; class=&quot;flex h-[1lh] shrink-0 items-center&quot;>
          <i class=&quot;material-icons block text-16 text-primary&quot;>
            {{ option.icon }}
          </i>
        </span>
        <span>{{ option.label }}</span>
        <span v-if=&quot;option.desc&quot; class=&quot;self-end text-[12px] text-gray-500&quot;>
          {{ option.desc }}
        </span>
      </div>
    </template>
    <template #selected-option=&quot;option&quot;>
      <div class=&quot;flex gap-6&quot;>
        <span v-if=&quot;option.icon&quot; class=&quot;flex h-[1lh] shrink-0 items-center&quot;>
          <i class=&quot;material-icons block text-16 text-primary&quot;>
            {{ option.icon }}
          </i>
        </span>
        <span>{{ option.label }}</span>
      </div>
    </template>
  </VueSelect>
  <p class=&quot;mt-8 text-sm text-muted-foreground&quot;>선택값: {{ selectedSubject }}</p>
</div>

<div>
  <Label for=&quot;vueSelectId_2&quot;>sm 사이즈, multiple 옵션, 갯수 표시</Label>
  <VueSelect
    id=&quot;vueSelectId_2&quot;
    :options=&quot;subjectOptions&quot;
    placeholder=&quot;과목을 선택하세요.&quot;
    no-option-text=&quot; 해당 과목이 없습니다.&quot;
    seleted-count=&quot;true&quot;
    size=&quot;sm&quot;
    multiple
    v-model=&quot;selectedSubject&quot;>
    <template #option=&quot;option&quot;>
      <div class=&quot;flex gap-8&quot;>
        <span v-if=&quot;option.icon&quot; class=&quot;flex h-[1lh] shrink-0 items-center&quot;>
          <i class=&quot;material-icons text-md block leading-[1.4] text-primary&quot;>
            {{ option.icon }}
          </i>
        </span>
        <span>{{ option.label }}</span>
        <span v-if=&quot;option.desc&quot; class=&quot;self-end text-[12px] text-gray-500&quot;>
          {{ option.desc }}
        </span>
      </div>
    </template>
    <template #selected-option=&quot;option&quot;>
      <div class=&quot;flex gap-6&quot;>
        <i
          v-if=&quot;option.icon&quot;
          class=&quot;material-icons block h-fit text-16 leading-[1.4] text-primary&quot;>
          {{ option.icon }}
        </i>
        <span>{{ option.label }}</span>
      </div>
    </template>
  </VueSelect>
  <p class=&quot;mt-8 text-sm text-muted-foreground&quot;>선택값: {{ selectedSubject }}</p>
</div>

<div>
  <Label for=&quot;vueSelectId_2&quot;>lg 사이즈</Label>
  <VueSelect
    id=&quot;vueSelectId_2&quot;
    :options=&quot;subjectOptions&quot;
    placeholder=&quot;과목을 선택하세요.&quot;
    no-option-text=&quot; 해당 과목이 없습니다.&quot;
    seleted-count=&quot;true&quot;
    size=&quot;lg&quot;
    multiple
    v-model=&quot;selectedSubject&quot;>
    <template #option=&quot;option&quot;>
      <div class=&quot;flex gap-8&quot;>
        <span v-if=&quot;option.icon&quot; class=&quot;flex h-[1lh] shrink-0 items-center&quot;>
          <i class=&quot;material-icons block text-lg leading-[1.4] text-primary&quot;>
            {{ option.icon }}
          </i>
        </span>
        <span>{{ option.label }}</span>
        <span v-if=&quot;option.desc&quot; class=&quot;self-end text-[12px] text-gray-500&quot;>
          {{ option.desc }}
        </span>
      </div>
    </template>
    <template #selected-option=&quot;option&quot;>
      <div class=&quot;flex gap-6&quot;>
        <i
          v-if=&quot;option.icon&quot;
          class=&quot;material-icons block h-fit text-16 leading-[1.4] text-primary&quot;>
          {{ option.icon }}
        </i>
        <span>{{ option.label }}</span>
      </div>
    </template>
  </VueSelect>
  <p class=&quot;mt-8 text-sm text-muted-foreground&quot;>선택값: {{ selectedSubject }}</p>
</div>
                `" />
              </CardContent>
            </Card>
          </div>
        </section>

        <section id="dropdownSection" class="mb-24 rounded-md bg-white p-16">
          <h3 class="text-24 font-medium text-gray-800">Dropdown</h3>
          <div class="content mt-16">
            <!-- 기본 -->
            <Card class="mb-24">
              <CardHeader>
                <div class="flex items-center justify-between">
                  <div>
                    <CardTitle>Dropdown</CardTitle>
                    <CardDescription>Dropdown 기본 ui</CardDescription>
                  </div>
                  <div>
                    <SwitchSquare
                      class="content-end"
                      :options="[
                        { value: 'preview', label: 'Preview', icon: 'visibility' },
                        { value: 'code', label: 'Code', icon: 'integration_instructions' },
                      ]"
                      v-model="previewState['dropdown']" />
                  </div>
                </div>
              </CardHeader>
              <CardContent v-show="previewState['dropdown'] == 'preview'">
                <!-- 기본 텍스트 트리거 -->
                <div class="grid grid-cols-4 gap-16">
                  <div>
                    <p class="mb-4 mr-4 inline-block text-sm text-gray-700">Separator</p>
                    <DropdownMenu>
                      <DropdownMenuTrigger>DropdownMenu</DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuLabel>Dropdown 라벨</DropdownMenuLabel>
                        <DropdownMenuItem>메뉴 아이템 1-1</DropdownMenuItem>
                        <DropdownMenuItem>메뉴 아이템 1-2</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel>Dropdown 라벨2</DropdownMenuLabel>
                        <DropdownMenuItem>메뉴 아이템 2-1</DropdownMenuItem>
                        <DropdownMenuItem class="text-danger">메뉴 아이템 2-2</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <!-- 사이즈 -->
                  <div>
                    <p class="mb-4 mr-4 inline-block text-sm text-gray-700">sm (텍스트 버튼)</p>
                    <DropdownMenu size="sm">
                      <DropdownMenuTrigger>DropdownMenu</DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem>Dropdown Item 1</DropdownMenuItem>
                        <DropdownMenuItem>Dropdown Item 2</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div>
                    <p class="mb-4 mr-4 inline-block text-sm text-gray-700">sm disabled</p>
                    <DropdownMenu size="sm">
                      <DropdownMenuTrigger disabled>DropdownMenu disabled</DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem>Dropdown Item 1</DropdownMenuItem>
                        <DropdownMenuItem>Dropdown Item 2</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div>
                    <p class="mb-4 mr-4 inline-block text-sm text-gray-700">lg (텍스트 버튼)</p>
                    <DropdownMenu size="lg">
                      <DropdownMenuTrigger>DropdownMenu</DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem>Dropdown Item 1</DropdownMenuItem>
                        <DropdownMenuItem>Dropdown Item 2</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                <!-- 아이콘 트리거 -->
                <div>
                  <p class="mb-4 mr-4 inline-block text-sm text-gray-700">아이콘 트리거</p>
                  <div class="mb-16 flex gap-32">
                    <DropdownMenu :ghost="true" size="sm">
                      <DropdownMenuTrigger class="h-32 w-32 rounded-[32px] p-6">
                        <i class="material-icons-round text-20">more_vert</i>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent class="w-fit">
                        <DropdownMenuItem>수정</DropdownMenuItem>
                        <DropdownMenuItem>복사</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem class="text-danger">삭제</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <DropdownMenu :ghost="true" size="sm">
                      <DropdownMenuTrigger disabled class="h-32 w-32 rounded-[32px] p-6">
                        <i class="material-icons-round text-20">more_vert</i>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent class="w-fit">
                        <DropdownMenuItem>수정</DropdownMenuItem>
                        <DropdownMenuItem>복사</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem class="text-danger">삭제</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <DropdownMenu :ghost="true" size="sm">
                      <DropdownMenuTrigger>
                        <i class="material-icons-round text-20">more_horiz</i>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent class="w-fit">
                        <DropdownMenuItem>수정</DropdownMenuItem>
                        <DropdownMenuItem>복사</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem class="text-danger">삭제</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
              <CardContent v-show="previewState['dropdown'] == 'code'">
                <CodeBlock
                  :code="`
<!-- 기본 텍스트 트리거 -->
<p class=&quot;mb-4 mr-4 inline-block text-sm text-gray-700&quot;>Separator</p>
<DropdownMenu>
  <DropdownMenuTrigger>DropdownMenu</DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuLabel>Dropdown 라벨</DropdownMenuLabel>
    <DropdownMenuItem>메뉴 아이템 1-1</DropdownMenuItem>
    <DropdownMenuItem>메뉴 아이템 1-2</DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuLabel>Dropdown 라벨2</DropdownMenuLabel>
    <DropdownMenuItem>메뉴 아이템 2-1</DropdownMenuItem>
    <DropdownMenuItem class=&quot;text-danger&quot;>메뉴 아이템 2-2</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>

<!-- Size - sm -->
<DropdownMenu size=&quot;sm&quot;>
  <DropdownMenuTrigger>DropdownMenu</DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem>Dropdown Item 1</DropdownMenuItem>
    <DropdownMenuItem>Dropdown Item 2</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
<!-- disabled -->
<div>
  <p class=&quot;mb-4 mr-4 inline-block text-sm text-gray-700&quot;>sm disabled</p>
  <DropdownMenu size=&quot;sm&quot;>
    <DropdownMenuTrigger disabled>DropdownMenu disabled</DropdownMenuTrigger>
    <DropdownMenuContent>
      <DropdownMenuItem>Dropdown Item 1</DropdownMenuItem>
      <DropdownMenuItem>Dropdown Item 2</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</div>
  
<!-- Size - lg -->
<p class=&quot;mb-4 mr-4 inline-block text-sm text-gray-700&quot;>lg (텍스트 버튼)</p>
<DropdownMenu size=&quot;lg&quot;>
  <DropdownMenuTrigger>DropdownMenu</DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem>Dropdown Item 1</DropdownMenuItem>
    <DropdownMenuItem>Dropdown Item 2</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>

<!-- 아이콘 트리거 -->
<DropdownMenu :ghost=&quot;true&quot; size=&quot;sm&quot;>
  <DropdownMenuTrigger class=&quot;h-32 w-32 rounded-[32px] p-6&quot;>
    <i class=&quot;material-icons-round text-20&quot;>more_vert</i>
  </DropdownMenuTrigger>
  <DropdownMenuContent class=&quot;w-fit&quot;>
    <DropdownMenuItem>수정</DropdownMenuItem>
    <DropdownMenuItem>복사</DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem class=&quot;text-danger&quot;>삭제</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
<!-- disabled -->
<DropdownMenu :ghost=&quot;true&quot; size=&quot;sm&quot;>
  <DropdownMenuTrigger disabled class=&quot;h-32 w-32 rounded-[32px] p-6&quot;>
    <i class=&quot;material-icons-round text-20&quot;>more_vert</i>
  </DropdownMenuTrigger>
  <DropdownMenuContent class=&quot;w-fit&quot;>
    <DropdownMenuItem>수정</DropdownMenuItem>
    <DropdownMenuItem>복사</DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem class=&quot;text-danger&quot;>삭제</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>


<DropdownMenu :ghost=&quot;true&quot; size=&quot;sm&quot;>
  <DropdownMenuTrigger>
    <i class=&quot;material-icons-round text-20&quot;>more_horiz</i>
  </DropdownMenuTrigger>
  <DropdownMenuContent class=&quot;w-fit&quot;>
    <DropdownMenuItem>수정</DropdownMenuItem>
    <DropdownMenuItem>복사</DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem class=&quot;text-danger&quot;>삭제</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
                `" />
              </CardContent>
            </Card>
            <!-- Checkbox -->
            <Card class="mb-24">
              <CardHeader>
                <div class="flex items-center justify-between">
                  <div>
                    <CardTitle>Dropdown</CardTitle>
                    <CardDescription>Dropdown Checkbox ui</CardDescription>
                  </div>
                  <div>
                    <SwitchSquare
                      class="content-end"
                      :options="[
                        { value: 'preview', label: 'Preview', icon: 'visibility' },
                        { value: 'code', label: 'Code', icon: 'integration_instructions' },
                      ]"
                      v-model="previewState['dropdown-checkbox']" />
                  </div>
                </div>
              </CardHeader>
              <CardContent v-show="previewState['dropdown-checkbox'] == 'preview'">
                <div>
                  <p class="mb-4 text-sm font-medium text-gray-500">Checkbox 항목 (기본)</p>
                  <DropdownMenu>
                    <DropdownMenuTrigger as-child>
                      <Button variant="outline">필터 선택</Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuLabel>표시 옵션</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuCheckboxItem v-model="showTitle">
                        제목 표시
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem v-model="showDate">
                        날짜 표시
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem v-model="showAuthor">
                        작성자 표시
                      </DropdownMenuCheckboxItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
              <CardContent v-show="previewState['dropdown-checkbox'] == 'code'">
                <CodeBlock
                  :code="`
<!-- 기본 텍스트 트리거 -->
<div>
  <p class=&quot;text-sm font-medium text-gray-500 mb-4&quot;>기본 (텍스트 버튼)</p>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button variant=&quot;outline&quot;>DropdownMenu</Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent>
      <DropdownMenuItem>Dropdown Item 1</DropdownMenuItem>
      <DropdownMenuItem>Dropdown Item 2</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</div>
<div>
  <p class=&quot;text-sm font-medium text-gray-500 mb-4 mt-12&quot;>Separator</p>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button variant=&quot;outline&quot;>DropdownMenu</Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent>
      <DropdownMenuLabel>Dropdown 라벨</DropdownMenuLabel>
      <DropdownMenuItem>메뉴 아이템 1-1</DropdownMenuItem>
      <DropdownMenuItem>메뉴 아이템 1-2</DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuLabel>Dropdown 라벨2</DropdownMenuLabel>
      <DropdownMenuItem>메뉴 아이템 2-1</DropdownMenuItem>
      <DropdownMenuItem class=&quot;text-danger&quot;>메뉴 아이템 2-2</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</div>
<script setup lang=&quot;ts&quot;>
  const showTitle = ref(true);
  const showDate = ref(false);
  const showAuthor = ref(false);
</script>
                `" />
              </CardContent>
            </Card>
          </div>
        </section>

        <section id="buttonSection" class="mb-24 rounded-md bg-white p-16">
          <h3 class="text-24 font-medium text-gray-800">Button</h3>
          <div class="content mt-16">
            <!-- 기본 -->
            <Card class="mb-24">
              <CardHeader>
                <div class="flex items-center justify-between">
                  <div>
                    <CardTitle>Buttons</CardTitle>
                  </div>
                  <div>
                    <SwitchSquare
                      class="content-end"
                      :options="[
                        { value: 'preview', label: 'Preview', icon: 'visibility' },
                        { value: 'code', label: 'Code', icon: 'integration_instructions' },
                      ]"
                      v-model="previewState['button']" />
                  </div>
                </div>
              </CardHeader>
              <CardContent v-show="previewState['button'] == 'preview'">
                <p>일반 버튼</p>
                <div class="mb-14 flex flex-wrap gap-8">
                  <Button>일반 버튼</Button>
                  <Button variant="secondary">secondary</Button>
                  <Button variant="danger">danger</Button>
                  <Button variant="success">success</Button>
                  <Button variant="info">info</Button>
                  <Button variant="warning">warning</Button>
                  <Button variant="outline">outline</Button>
                  <Button variant="ghost">ghost</Button>
                  <Button variant="none">none</Button>
                </div>
                <p>outline 버튼</p>
                <div class="mb-14 flex flex-wrap gap-8">
                  <Button variant="outline-primary">outline primary</Button>
                  <Button variant="outline-primary-2">outline primary 2</Button>
                  <Button variant="outline-danger">outline danger</Button>
                  <Button variant="outline-secondary">outline secondary</Button>
                  <Button variant="outline-success">outline-success</Button>
                  <Button variant="outline-info">outline-info</Button>
                  <Button variant="outline-warning">outline-warning</Button>
                </div>
                <p>size - sm 버튼</p>
                <div class="mb-14 flex flex-wrap gap-8">
                  <Button size="sm" variant="primary" disabled>primary disabled</Button>
                  <Button size="sm" variant="secondary">secondary</Button>
                  <Button size="sm" variant="danger">danger</Button>
                </div>
                <p>size - lg 버튼</p>
                <div class="mb-14 flex flex-wrap gap-8">
                  <Button size="lg" variant="outline-success">outline-success</Button>
                  <Button size="lg" variant="outline-info">outline-info</Button>
                  <Button size="lg" variant="outline-warning">outline-warning</Button>
                </div>
                <p>Button + NuxtLink</p>
                <div class="flex flex-wrap gap-8">
                  <Button as-child variant="outline-primary" size="sm">
                    <NuxtLink to="/">홈으로 가기</NuxtLink>
                  </Button>
                </div>
              </CardContent>

              <CardContent v-show="previewState['button'] == 'code'">
                <CodeBlock
                  :code="`
<!-- 일반버튼 -->
<Button>일반버튼</Button>

<!-- 배경 스타일 -->
<Button variant=&quot;secondary&quot;>secondary</Button>
<Button variant=&quot;danger&quot;>danger</Button>
<Button variant=&quot;success&quot;>success</Button>
<Button variant=&quot;info&quot;>info</Button>
<Button variant=&quot;warning&quot;>warning</Button>
<Button variant=&quot;outline&quot;>outline</Button>
<Button variant=&quot;ghost&quot;>ghost</Button>
<Button variant=&quot;none&quot;>none</Button>

<!-- outline 버튼 -->
<Button variant=&quot;outline-primary&quot;>outline primary</Button>
<Button variant=&quot;outline-danger&quot;>outline danger</Button>
<Button variant=&quot;outline-secondary&quot;>outline secondary</Button>
<Button variant=&quot;outline-success&quot;>outline-success</Button>
<Button variant=&quot;outline-info&quot;>outline-info</Button>
<Button variant=&quot;outline-warning&quot;>outline-warning</Button>

<!-- size - sm 버튼 -->
<Button size=&quot;sm&quot; variant=&quot;primary&quot; disabled>primary disabled</Button>
<Button size=&quot;sm&quot; variant=&quot;secondary&quot;>secondary</Button>
<Button size=&quot;sm&quot; variant=&quot;danger&quot;>danger</Button>
<!-- size - lg 버튼 -->
<Button size=&quot;lg&quot; variant=&quot;outline-success&quot;>outline-success</Button>
<Button size=&quot;lg&quot; variant=&quot;outline-info&quot;>outline-info</Button>
<Button size=&quot;lg&quot; variant=&quot;outline-warning&quot;>outline-warning</Button>

<!-- Button + NuxtLink 버튼 -->
<div class=&quot;flex flex-wrap gap-8&quot;>
  <Button as-child variant=&quot;outline-primary&quot; size=&quot;sm&quot;>
    <NuxtLink to=&quot;/&quot;>홈으로 가기</NuxtLink>
  </Button>
</div>
                  `" />
              </CardContent>
            </Card>
          </div>
        </section>

        <section id="badgeSection" class="mb-24 rounded-md bg-white p-16">
          <h3 class="text-24 font-medium text-gray-800">Badge</h3>
          <div class="content mt-16">
            <!-- 기본 -->
            <Card class="mb-24">
              <CardHeader>
                <div class="flex items-center justify-between">
                  <div>
                    <CardTitle>Badge</CardTitle>
                  </div>
                  <div>
                    <SwitchSquare
                      class="content-end"
                      :options="[
                        { value: 'preview', label: 'Preview', icon: 'visibility' },
                        { value: 'code', label: 'Code', icon: 'integration_instructions' },
                      ]"
                      v-model="previewState['badge']" />
                  </div>
                </div>
              </CardHeader>
              <CardContent v-show="previewState['badge'] == 'preview'">
                <div class="mb-8 flex gap-8">
                  <Badge variant="primary">Badge</Badge>
                  <Badge variant="secondary">Badge</Badge>
                  <Badge variant="danger">Badge</Badge>
                  <Badge variant="success">Badge</Badge>
                  <Badge variant="info">Badge</Badge>
                  <Badge variant="warning">Badge</Badge>
                  <Badge variant="outline">Badge</Badge>
                </div>
                <div class="flex gap-8">
                  <Badge variant="outline-primary">Badge</Badge>
                  <Badge variant="outline-secondary">Badge</Badge>
                  <Badge variant="outline-danger">Badge</Badge>
                  <Badge variant="outline-success">Badge</Badge>
                  <Badge variant="outline-info">Badge</Badge>
                  <Badge variant="outline-warning">Badge</Badge>
                </div>
              </CardContent>

              <CardContent v-show="previewState['badge'] == 'code'">
                <CodeBlock
                  :code="`
<Badge variant=&quot;primary&quot;>Badge</Badge>
<Badge variant=&quot;secondary&quot;>Badge</Badge>
<Badge variant=&quot;danger&quot;>Badge</Badge>
<Badge variant=&quot;success&quot;>Badge</Badge>
<Badge variant=&quot;info&quot;>Badge</Badge>
<Badge variant=&quot;warning&quot;>Badge</Badge>
<Badge variant=&quot;outline&quot;>Badge</Badge>

<!-- outline -->
<Badge variant=&quot;outline-primary&quot;>Badge</Badge>
<Badge variant=&quot;outline-secondary&quot;>Badge</Badge>
<Badge variant=&quot;outline-danger&quot;>Badge</Badge>
<Badge variant=&quot;outline-success&quot;>Badge</Badge>
<Badge variant=&quot;outline-info&quot;>Badge</Badge>
<Badge variant=&quot;outline-warning&quot;>Badge</Badge>
                  `" />
              </CardContent>
            </Card>
          </div>
        </section>

        <section id="dialogSection" class="mb-24 rounded-md bg-white p-16">
          <h3 class="text-24 font-medium text-gray-800">Alert / Modal</h3>
          <div class="content mt-16">
            <!-- Alert -->
            <Card class="mb-24">
              <CardHeader>
                <div class="flex items-center justify-between">
                  <div>
                    <CardTitle>AlertDialog</CardTitle>
                    <CardDescription>Dialog를 활용한 AlertDialog 컴포넌트 입니다.</CardDescription>
                  </div>
                  <div>
                    <SwitchSquare
                      class="content-end"
                      :options="[
                        { value: 'preview', label: 'Preview', icon: 'visibility' },
                        { value: 'code', label: 'Code', icon: 'integration_instructions' },
                      ]"
                      v-model="previewState['alert']" />
                  </div>
                </div>
              </CardHeader>
              <CardContent v-show="previewState['alert'] == 'preview'">
                <div class="flex flex-wrap gap-8">
                  <!-- primary - custom -->
                  <AlertDialog variant="primary" msg="인포 메세지">
                    <template #trigger>
                      <Button variant="primary" size="sm">custom - primary</Button>
                    </template>
                    <template #title>Primary Alert의 title 입니다.</template>
                    <p>테스트를 위한 알림메세지 입니다.</p>
                    <template #footer>
                      <Button variant="primary" size="sm">확인</Button>
                      <Button variant="outline" size="sm" click-close="false">
                        clickClose: false
                      </Button>
                    </template>
                  </AlertDialog>

                  <!-- danger -->
                  <AlertDialog variant="danger" msg="!경고!">
                    <template #trigger>
                      <Button variant="danger" size="sm">danger</Button>
                    </template>
                    <template #title>선택한 데이터를 삭제하시겠습니까?</template>
                    <p>삭제 후 데이터는 복구되지 않습니다.</p>
                    <template #footer>
                      <Button variant="danger" size="sm">삭제</Button>
                      <Button variant="outline" size="sm">취소</Button>
                    </template>
                  </AlertDialog>

                  <!-- warning -->
                  <AlertDialog variant="warning" msg="warning">
                    <template #trigger>
                      <Button variant="warning" size="sm">warning</Button>
                    </template>
                    <template #title>버튼에 링크 적용하기</template>
                    <template #footer>
                      <Button as-child variant="warning" size="sm">
                        <NuxtLink to="/">홈으로 가기</NuxtLink>
                      </Button>
                    </template>
                  </AlertDialog>

                  <!-- success -->
                  <AlertDialog variant="success">
                    <template #trigger>
                      <Button variant="success" size="sm">success</Button>
                    </template>
                    <template #title>success Alert의 title 입니다.</template>
                    <template #footer>
                      <Button variant="success" size="sm">닫기</Button>
                    </template>
                  </AlertDialog>

                  <!-- info -->
                  <AlertDialog variant="info">
                    <template #trigger>
                      <Button variant="info" size="sm">info</Button>
                    </template>
                    <template #title>info Alert의 title 입니다.</template>
                    <template #footer>
                      <Button variant="info" size="sm">닫기</Button>
                    </template>
                  </AlertDialog>
                </div>
              </CardContent>

              <CardContent v-show="previewState['alert'] == 'code'">
                <CodeBlock
                  :code="`
<!-- primary - custom -->
<AlertDialog variant=&quot;primary&quot; msg=&quot;인포 메세지&quot;>
  <template #trigger>
    <Button variant=&quot;primary&quot; size=&quot;sm&quot;>custom - primary</Button>
  </template>
  <template #title>Primary Alert의 title 입니다.</template>
  <p>테스트를 위한 알림메세지 입니다.</p>
  <template #footer>
    <Button variant=&quot;primary&quot; size=&quot;sm&quot;>확인</Button>
    <Button variant=&quot;outline&quot; size=&quot;sm&quot; clickClose=&quot;false&quot;>
      clickClose: false
    </Button>
  </template>
</AlertDialog>

<!-- danger -->
<AlertDialog variant=&quot;danger&quot; msg=&quot;!경고!&quot;>
  <template #trigger>
    <Button variant=&quot;danger&quot; size=&quot;sm&quot;>danger</Button>
  </template>
  <template #title>선택한 데이터를 삭제하시겠습니까?</template>
  <p>삭제 후 데이터는 복구되지 않습니다.</p>
  <template #footer>
    <Button variant=&quot;danger&quot; size=&quot;sm&quot;>삭제</Button>
    <Button variant=&quot;outline&quot; size=&quot;sm&quot;>취소</Button>
  </template>
</AlertDialog>

<!-- warning -->
<AlertDialog variant=&quot;warning&quot; msg=&quot;warning&quot;>
  <template #trigger>
    <Button variant=&quot;warning&quot; size=&quot;sm&quot;>warning</Button>
  </template>
  <template #title>버튼에 링크 적용하기</template>
  <template #footer>
    <Button as-child variant=&quot;warning&quot; size=&quot;sm&quot;>
      <NuxtLink to=&quot;/&quot;>
        홈으로 가기
      </NuxtLink>
    </Button>
  </template>
</AlertDialog>

<!-- success -->
<AlertDialog variant=&quot;success&quot;>
  <template #trigger>
    <Button variant=&quot;success&quot; size=&quot;sm&quot;>success</Button>
  </template>
  <template #title>success Alert의 title 입니다.</template>
  <template #footer>
    <Button variant=&quot;success&quot; size=&quot;sm&quot;>닫기</Button>
  </template>
</AlertDialog>

<!-- info -->
<AlertDialog variant=&quot;info&quot;>
  <template #trigger>
    <Button variant=&quot;info&quot; size=&quot;sm&quot;>info</Button>
  </template>
  <template #title>info Alert의 title 입니다.</template>
  <template #footer>
    <Button variant=&quot;info&quot; size=&quot;sm&quot;>닫기</Button>
  </template>
</AlertDialog>
                `" />
              </CardContent>
            </Card>
            <!-- 기본 -->
            <Card class="mb-24">
              <CardHeader>
                <div class="flex items-center justify-between">
                  <div>
                    <CardTitle>Modal (Dialog)</CardTitle>
                  </div>
                  <div>
                    <SwitchSquare
                      class="content-end"
                      :options="[
                        { value: 'preview', label: 'Preview', icon: 'visibility' },
                        { value: 'code', label: 'Code', icon: 'integration_instructions' },
                      ]"
                      v-model="previewState['modal']" />
                  </div>
                </div>
              </CardHeader>
              <CardContent v-show="previewState['modal'] == 'preview'">
                <div class="flex gap-8">
                  <!-- 기본 -->
                  <Dialog>
                    <DialogTrigger as-child>
                      <Button variant="outline">기본(md) modal</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <template #header>
                        <DialogHeader>
                          <DialogTitle>Edit profile</DialogTitle>
                          <DialogDescription>
                            Make changes to your profile here. Click save when youre done.
                          </DialogDescription>
                        </DialogHeader>
                      </template>
                      <div>
                        <p>
                          군인은 현역을 면한 후가 아니면 국무위원으로 임명될 수 없다. 법관은 탄핵
                          또는 금고 이상의 형의 선고에 의하지 아니하고는 파면되지 아니하며,
                          징계처분에 의하지 아니하고는 정직·감봉 기타 불리한 처분을 받지 아니한다.
                        </p>
                        <p>
                          Lorem ipsum dolor, sit amet consectetur adipisicing elit. Sed, consequatur
                          qui mollitia quas laborum totam tenetur! Quis illum, nihil cum deserunt
                          aperiam ipsam commodi quasi natus esse! Ratione, cupiditate asperiores.
                        </p>
                        <p>
                          대통령의 임기는 5년으로 하며, 중임할 수 없다. 훈장등의 영전은 이를 받은
                          자에게만 효력이 있고, 어떠한 특권도 이에 따르지 아니한다. 대통령은 법률이
                          정하는 바에 의하여 훈장 기타의 영전을 수여한다.
                        </p>
                      </div>
                      <template #footer>
                        <DialogFooter>
                          <DialogClose as-child>
                            <Button variant="outline">닫기</Button>
                          </DialogClose>
                          <Button type="submit" variant="primary">저장</Button>
                        </DialogFooter>
                      </template>
                    </DialogContent>
                  </Dialog>

                  <Dialog>
                    <DialogTrigger as-child>
                      <Button variant="outline">sm modal</Button>
                    </DialogTrigger>
                    <DialogContent size="sm">
                      <template #header>
                        <DialogHeader>
                          <DialogTitle>Edit profile</DialogTitle>
                          <DialogDescription>
                            Make changes to your profile here. Click save when youre done.
                          </DialogDescription>
                        </DialogHeader>
                      </template>
                      <div>
                        <p>
                          군인은 현역을 면한 후가 아니면 국무위원으로 임명될 수 없다. 법관은 탄핵
                          또는 금고 이상의 형의 선고에 의하지 아니하고는 파면되지 아니하며,
                          징계처분에 의하지 아니하고는 정직·감봉 기타 불리한 처분을 받지 아니한다.
                        </p>
                        <p>
                          Lorem ipsum dolor, sit amet consectetur adipisicing elit. Sed, consequatur
                          qui mollitia quas laborum totam tenetur! Quis illum, nihil cum deserunt
                          aperiam ipsam commodi quasi natus esse! Ratione, cupiditate asperiores.
                        </p>
                        <p>
                          대통령의 임기는 5년으로 하며, 중임할 수 없다. 훈장등의 영전은 이를 받은
                          자에게만 효력이 있고, 어떠한 특권도 이에 따르지 아니한다. 대통령은 법률이
                          정하는 바에 의하여 훈장 기타의 영전을 수여한다.
                        </p>
                      </div>
                      <template #footer>
                        <DialogFooter>
                          <DialogClose as-child>
                            <Button variant="outline">닫기</Button>
                          </DialogClose>
                          <Button type="submit" variant="primary">저장</Button>
                        </DialogFooter>
                      </template>
                    </DialogContent>
                  </Dialog>

                  <Dialog>
                    <DialogTrigger as-child>
                      <Button variant="outline">lg modal</Button>
                    </DialogTrigger>
                    <DialogContent size="lg">
                      <template #header>
                        <DialogHeader>
                          <DialogTitle>Edit profile</DialogTitle>
                          <DialogDescription>
                            Make changes to your profile here. Click save when youre done.
                          </DialogDescription>
                        </DialogHeader>
                      </template>
                      <div>
                        <p>
                          군인은 현역을 면한 후가 아니면 국무위원으로 임명될 수 없다. 법관은 탄핵
                          또는 금고 이상의 형의 선고에 의하지 아니하고는 파면되지 아니하며,
                          징계처분에 의하지 아니하고는 정직·감봉 기타 불리한 처분을 받지 아니한다.
                        </p>
                        <p>
                          Lorem ipsum dolor, sit amet consectetur adipisicing elit. Sed, consequatur
                          qui mollitia quas laborum totam tenetur! Quis illum, nihil cum deserunt
                          aperiam ipsam commodi quasi natus esse! Ratione, cupiditate asperiores.
                        </p>
                        <p>
                          대통령의 임기는 5년으로 하며, 중임할 수 없다. 훈장등의 영전은 이를 받은
                          자에게만 효력이 있고, 어떠한 특권도 이에 따르지 아니한다. 대통령은 법률이
                          정하는 바에 의하여 훈장 기타의 영전을 수여한다.
                        </p>
                      </div>
                      <template #footer>
                        <DialogFooter>
                          <DialogClose as-child>
                            <Button variant="outline">닫기</Button>
                          </DialogClose>
                          <Button type="submit" variant="primary">저장</Button>
                        </DialogFooter>
                      </template>
                    </DialogContent>
                  </Dialog>

                  <Dialog>
                    <DialogTrigger as-child>
                      <Button variant="outline">xl modal</Button>
                    </DialogTrigger>
                    <DialogContent size="xl">
                      <template #header>
                        <DialogHeader>
                          <DialogTitle>Edit profile</DialogTitle>
                          <DialogDescription>
                            Make changes to your profile here. Click save when youre done.
                          </DialogDescription>
                        </DialogHeader>
                      </template>
                      <div>
                        <p>
                          군인은 현역을 면한 후가 아니면 국무위원으로 임명될 수 없다. 법관은 탄핵
                          또는 금고 이상의 형의 선고에 의하지 아니하고는 파면되지 아니하며,
                          징계처분에 의하지 아니하고는 정직·감봉 기타 불리한 처분을 받지 아니한다.
                        </p>
                        <p>
                          Lorem ipsum dolor, sit amet consectetur adipisicing elit. Sed, consequatur
                          qui mollitia quas laborum totam tenetur! Quis illum, nihil cum deserunt
                          aperiam ipsam commodi quasi natus esse! Ratione, cupiditate asperiores.
                        </p>
                        <p>
                          대통령의 임기는 5년으로 하며, 중임할 수 없다. 훈장등의 영전은 이를 받은
                          자에게만 효력이 있고, 어떠한 특권도 이에 따르지 아니한다. 대통령은 법률이
                          정하는 바에 의하여 훈장 기타의 영전을 수여한다.
                        </p>
                      </div>
                      <template #footer>
                        <DialogFooter>
                          <DialogClose as-child>
                            <Button variant="outline">닫기</Button>
                          </DialogClose>
                          <Button type="submit" variant="primary">저장</Button>
                        </DialogFooter>
                      </template>
                    </DialogContent>
                  </Dialog>

                  <Dialog>
                    <DialogTrigger as-child>
                      <Button variant="outline">2xl modal</Button>
                    </DialogTrigger>
                    <DialogContent size="2xl">
                      <template #header>
                        <DialogHeader>
                          <DialogTitle>Edit profile</DialogTitle>
                          <DialogDescription>
                            Make changes to your profile here. Click save when youre done.
                          </DialogDescription>
                        </DialogHeader>
                      </template>
                      <div>
                        <p>
                          군인은 현역을 면한 후가 아니면 국무위원으로 임명될 수 없다. 법관은 탄핵
                          또는 금고 이상의 형의 선고에 의하지 아니하고는 파면되지 아니하며,
                          징계처분에 의하지 아니하고는 정직·감봉 기타 불리한 처분을 받지 아니한다.
                        </p>
                        <p>
                          Lorem ipsum dolor, sit amet consectetur adipisicing elit. Sed, consequatur
                          qui mollitia quas laborum totam tenetur! Quis illum, nihil cum deserunt
                          aperiam ipsam commodi quasi natus esse! Ratione, cupiditate asperiores.
                        </p>
                        <p>
                          대통령의 임기는 5년으로 하며, 중임할 수 없다. 훈장등의 영전은 이를 받은
                          자에게만 효력이 있고, 어떠한 특권도 이에 따르지 아니한다. 대통령은 법률이
                          정하는 바에 의하여 훈장 기타의 영전을 수여한다.
                        </p>
                      </div>
                      <template #footer>
                        <DialogFooter>
                          <DialogClose as-child>
                            <Button variant="outline">닫기</Button>
                          </DialogClose>
                          <Button type="submit" variant="primary">저장</Button>
                        </DialogFooter>
                      </template>
                    </DialogContent>
                  </Dialog>

                  <!-- closeIcon False // backdrop 클릭 시 모달 안닫힘 -->
                  <Dialog :close-icon="false" :backdrop="true">
                    <DialogTrigger as-child>
                      <Button variant="outline">icon X, backdrop 클릭 시 모달 안닫힘</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <template #header>
                        <DialogHeader>
                          <DialogTitle>Edit profile</DialogTitle>
                          <DialogDescription>
                            Make changes to your profile here. Click save when youre done.
                          </DialogDescription>
                        </DialogHeader>
                      </template>
                      <div class="grid max-h-300 gap-8 py-8">
                        <div>
                          <Label for="modalName">이름</Label>
                          <Input id="modalName" placeholder="이름을 입력해주세요." />
                        </div>
                        <div>
                          <Label for="modalEmail">email</Label>
                          <Input id="modalEmail" placeholder="이메일을 입력해주세요." />
                        </div>
                      </div>
                      <template #footer>
                        <DialogFooter>
                          <DialogClose as-child>
                            <Button variant="outline">닫기</Button>
                          </DialogClose>
                          <Button type="submit" variant="primary">저장</Button>
                        </DialogFooter>
                      </template>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>

              <CardContent v-show="previewState['modal'] == 'code'">
                <CodeBlock
                  :code="`
<!-- 기본 -->
<Dialog>
  <DialogTrigger as-child>
    <Button variant=&quot;outline&quot;>기본(md) modal</Button>
  </DialogTrigger>
  <DialogContent>
    <template #header>
      <DialogHeader>
        <DialogTitle>Edit profile</DialogTitle>
        <DialogDescription>
          Make changes to your profile here. Click save when youre done.
        </DialogDescription>
      </DialogHeader>
    </template>
    <div>
      <p>
        군인은 현역을 면한 후가 아니면 국무위원으로 임명될 수 없다. 법관은 탄핵
        또는 금고 이상의 형의 선고에 의하지 아니하고는 파면되지 아니하며,
        징계처분에 의하지 아니하고는 정직·감봉 기타 불리한 처분을 받지 아니한다.
      </p>
      <p>
        Lorem ipsum dolor, sit amet consectetur adipisicing elit. Sed, consequatur
        qui mollitia quas laborum totam tenetur! Quis illum, nihil cum deserunt
        aperiam ipsam commodi quasi natus esse! Ratione, cupiditate asperiores.
      </p>
      <p>
        대통령의 임기는 5년으로 하며, 중임할 수 없다. 훈장등의 영전은 이를 받은
        자에게만 효력이 있고, 어떠한 특권도 이에 따르지 아니한다. 대통령은 법률이
        정하는 바에 의하여 훈장 기타의 영전을 수여한다.
      </p>
    </div>
    <template #footer>
      <DialogFooter>
        <DialogClose as-child>
          <Button variant=&quot;outline&quot;>닫기</Button>
        </DialogClose>
        <Button type=&quot;submit&quot; variant=&quot;primary&quot;>저장</Button>
      </DialogFooter>
    </template>
  </DialogContent>
</Dialog>

<!-- sm -->
<Dialog>
  <DialogTrigger as-child>
    <Button variant=&quot;outline&quot;>sm modal</Button>
  </DialogTrigger>
  <DialogContent size=&quot;sm&quot;>
    <template #header>
      <DialogHeader>
        <DialogTitle>Edit profile</DialogTitle>
        <DialogDescription>
          Make changes to your profile here. Click save when youre done.
        </DialogDescription>
      </DialogHeader>
    </template>
    <div>
      <p>
        군인은 현역을 면한 후가 아니면 국무위원으로 임명될 수 없다. 법관은 탄핵
        또는 금고 이상의 형의 선고에 의하지 아니하고는 파면되지 아니하며,
        징계처분에 의하지 아니하고는 정직·감봉 기타 불리한 처분을 받지 아니한다.
      </p>
      <p>
        Lorem ipsum dolor, sit amet consectetur adipisicing elit. Sed, consequatur
        qui mollitia quas laborum totam tenetur! Quis illum, nihil cum deserunt
        aperiam ipsam commodi quasi natus esse! Ratione, cupiditate asperiores.
      </p>
      <p>
        대통령의 임기는 5년으로 하며, 중임할 수 없다. 훈장등의 영전은 이를 받은
        자에게만 효력이 있고, 어떠한 특권도 이에 따르지 아니한다. 대통령은 법률이
        정하는 바에 의하여 훈장 기타의 영전을 수여한다.
      </p>
    </div>
    <template #footer>
      <DialogFooter>
        <DialogClose as-child>
          <Button variant=&quot;outline&quot;>닫기</Button>
        </DialogClose>
        <Button type=&quot;submit&quot; variant=&quot;primary&quot;>저장</Button>
      </DialogFooter>
    </template>
  </DialogContent>
</Dialog>

<!-- lg -->
<Dialog>
  <DialogTrigger as-child>
    <Button variant=&quot;outline&quot;>lg modal</Button>
  </DialogTrigger>
  <DialogContent size=&quot;lg&quot;>
    <template #header>
      <DialogHeader>
        <DialogTitle>Edit profile</DialogTitle>
        <DialogDescription>
          Make changes to your profile here. Click save when youre done.
        </DialogDescription>
      </DialogHeader>
    </template>
    <div>
      <p>
        군인은 현역을 면한 후가 아니면 국무위원으로 임명될 수 없다. 법관은 탄핵
        또는 금고 이상의 형의 선고에 의하지 아니하고는 파면되지 아니하며,
        징계처분에 의하지 아니하고는 정직·감봉 기타 불리한 처분을 받지 아니한다.
      </p>
      <p>
        Lorem ipsum dolor, sit amet consectetur adipisicing elit. Sed, consequatur
        qui mollitia quas laborum totam tenetur! Quis illum, nihil cum deserunt
        aperiam ipsam commodi quasi natus esse! Ratione, cupiditate asperiores.
      </p>
      <p>
        대통령의 임기는 5년으로 하며, 중임할 수 없다. 훈장등의 영전은 이를 받은
        자에게만 효력이 있고, 어떠한 특권도 이에 따르지 아니한다. 대통령은 법률이
        정하는 바에 의하여 훈장 기타의 영전을 수여한다.
      </p>
    </div>
    <template #footer>
      <DialogFooter>
        <DialogClose as-child>
          <Button variant=&quot;outline&quot;>닫기</Button>
        </DialogClose>
        <Button type=&quot;submit&quot; variant=&quot;primary&quot;>저장</Button>
      </DialogFooter>
    </template>
  </DialogContent>
</Dialog>

<!-- xl -->
<Dialog>
  <DialogTrigger as-child>
    <Button variant=&quot;outline&quot;>xl modal</Button>
  </DialogTrigger>
  <DialogContent size=&quot;xl&quot;>
    <template #header>
      <DialogHeader>
        <DialogTitle>Edit profile</DialogTitle>
        <DialogDescription>
          Make changes to your profile here. Click save when youre done.
        </DialogDescription>
      </DialogHeader>
    </template>
    <div>
      <p>
        군인은 현역을 면한 후가 아니면 국무위원으로 임명될 수 없다. 법관은 탄핵
        또는 금고 이상의 형의 선고에 의하지 아니하고는 파면되지 아니하며,
        징계처분에 의하지 아니하고는 정직·감봉 기타 불리한 처분을 받지 아니한다.
      </p>
      <p>
        Lorem ipsum dolor, sit amet consectetur adipisicing elit. Sed, consequatur
        qui mollitia quas laborum totam tenetur! Quis illum, nihil cum deserunt
        aperiam ipsam commodi quasi natus esse! Ratione, cupiditate asperiores.
      </p>
      <p>
        대통령의 임기는 5년으로 하며, 중임할 수 없다. 훈장등의 영전은 이를 받은
        자에게만 효력이 있고, 어떠한 특권도 이에 따르지 아니한다. 대통령은 법률이
        정하는 바에 의하여 훈장 기타의 영전을 수여한다.
      </p>
    </div>
    <template #footer>
      <DialogFooter>
        <DialogClose as-child>
          <Button variant=&quot;outline&quot;>닫기</Button>
        </DialogClose>
        <Button type=&quot;submit&quot; variant=&quot;primary&quot;>저장</Button>
      </DialogFooter>
    </template>
  </DialogContent>
</Dialog>

<!-- 2xl -->
<Dialog>
  <DialogTrigger as-child>
    <Button variant=&quot;outline&quot;>2xl modal</Button>
  </DialogTrigger>
  <DialogContent size=&quot;2xl&quot;>
    <template #header>
      <DialogHeader>
        <DialogTitle>Edit profile</DialogTitle>
        <DialogDescription>
          Make changes to your profile here. Click save when youre done.
        </DialogDescription>
      </DialogHeader>
    </template>
    <div>
      <p>
        군인은 현역을 면한 후가 아니면 국무위원으로 임명될 수 없다. 법관은 탄핵
        또는 금고 이상의 형의 선고에 의하지 아니하고는 파면되지 아니하며,
        징계처분에 의하지 아니하고는 정직·감봉 기타 불리한 처분을 받지 아니한다.
      </p>
      <p>
        Lorem ipsum dolor, sit amet consectetur adipisicing elit. Sed, consequatur
        qui mollitia quas laborum totam tenetur! Quis illum, nihil cum deserunt
        aperiam ipsam commodi quasi natus esse! Ratione, cupiditate asperiores.
      </p>
      <p>
        대통령의 임기는 5년으로 하며, 중임할 수 없다. 훈장등의 영전은 이를 받은
        자에게만 효력이 있고, 어떠한 특권도 이에 따르지 아니한다. 대통령은 법률이
        정하는 바에 의하여 훈장 기타의 영전을 수여한다.
      </p>
    </div>
    <template #footer>
      <DialogFooter>
        <DialogClose as-child>
          <Button variant=&quot;outline&quot;>닫기</Button>
        </DialogClose>
        <Button type=&quot;submit&quot; variant=&quot;primary&quot;>저장</Button>
      </DialogFooter>
    </template>
  </DialogContent>
</Dialog>

<!-- closeIcon False // backdrop 클릭 시 모달 안닫힘 -->
<Dialog :closeIcon=&quot;false&quot; :backdrop=&quot;true&quot;>
  <DialogTrigger as-child>
    <Button variant=&quot;outline&quot;>icon X, max-height, backdrop</Button>
  </DialogTrigger>
  <DialogContent>
    <template #header>
      <DialogHeader>
        <DialogTitle>Edit profile</DialogTitle>
        <DialogDescription>
          Make changes to your profile here. Click save when youre done.
        </DialogDescription>
      </DialogHeader>
    </template>
    <div class=&quot;grid max-h-300 gap-8 py-8&quot;>
      <div>
        <Label for=&quot;modalName&quot;>이름</Label>
        <Input id=&quot;modalName&quot; placeholder=&quot;이름을 입력해주세요.&quot; />
      </div>
      <div>
        <Label for=&quot;modalEmail&quot;>email</Label>
        <Input id=&quot;modalEmail&quot; placeholder=&quot;이메일을 입력해주세요.&quot; />
      </div>
    </div>
    <template #footer>
      <DialogFooter>
        <DialogClose as-child>
          <Button variant=&quot;outline&quot;>닫기</Button>
        </DialogClose>
        <Button type=&quot;submit&quot; variant=&quot;primary&quot;>저장</Button>
      </DialogFooter>
    </template>
  </DialogContent>
</Dialog>
                `" />
              </CardContent>
            </Card>
          </div>
        </section>

        <section id="tooltipSection" class="mb-24 rounded-md bg-white p-16">
          <h3 class="text-24 font-medium text-gray-800">Tooltip</h3>
          <div class="content mt-16">
            <!-- 기본 -->
            <Card class="mb-24">
              <CardHeader>
                <div class="flex items-center justify-between">
                  <div>
                    <CardTitle>Tooltip</CardTitle>
                    <CardDescription>Tooltip 기본 ui</CardDescription>
                  </div>
                  <div>
                    <SwitchSquare
                      class="content-end"
                      :options="[
                        { value: 'preview', label: 'Preview', icon: 'visibility' },
                        { value: 'code', label: 'Code', icon: 'integration_instructions' },
                      ]"
                      v-model="previewState['tooltip']" />
                  </div>
                </div>
              </CardHeader>
              <CardContent v-show="previewState['tooltip'] == 'preview'">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger as-child>
                      <Button variant="outline">호버해보세요</Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>툴팁 내용입니다</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <span class="m-4" />

                <TooltipProvider>
                  <Tooltip :disabled="true">
                    <TooltipTrigger as-child>
                      <Button variant="outline" :disabled="true">비활성화된 툴팁</Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>이 툴팁은 보이지 않습니다.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <span class="m-4" />

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger as-child>
                      <Button variant="ghost">
                        <i class="material-icons-round text-20">info</i>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>아이콘 버튼 툴팁</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardContent>

              <CardContent v-show="previewState['tooltip'] == 'code'">
                <CodeBlock
                  :code="`
<!-- 일반 Tooltip= -->
<TooltipProvider>
  <Tooltip>
    <TooltipTrigger as-child>
      <Button variant=&quot;outline&quot;>호버해보세요</Button>
    </TooltipTrigger>
    <TooltipContent>
      <p>툴팁 내용입니다</p>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>

<!-- 비활성화 -->
<TooltipProvider>
  <Tooltip :disabled=&quot;true&quot;>
    <TooltipTrigger as-child>
      <Button variant=&quot;outline&quot; :disabled=&quot;true&quot;>비활성화된 툴팁</Button>
    </TooltipTrigger>
    <TooltipContent>
      <p>이 툴팁은 보이지 않습니다.</p>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>

<!-- 아이콘 -->
<TooltipProvider>
  <Tooltip>
    <TooltipTrigger as-child>
      <Button variant=&quot;ghost&quot;>
        <i class=&quot;material-icons-round text-20&quot;>info</i>
      </Button>
    </TooltipTrigger>
    <TooltipContent>
      <p>아이콘 버튼 툴팁</p>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>
  `" />
              </CardContent>
            </Card>
            <!-- side -->
            <Card class="mb-24">
              <CardHeader>
                <div class="flex items-center justify-between">
                  <div>
                    <CardTitle>Tooltip side</CardTitle>
                    <CardDescription>Tooltip 방향 (side) 확인</CardDescription>
                  </div>
                  <div>
                    <SwitchSquare
                      class="content-end"
                      :options="[
                        { value: 'preview', label: 'Preview', icon: 'visibility' },
                        { value: 'code', label: 'Code', icon: 'integration_instructions' },
                      ]"
                      v-model="previewState['tooltip-side']" />
                  </div>
                </div>
              </CardHeader>
              <CardContent v-show="previewState['tooltip-side'] == 'preview'">
                <div class="flex flex-wrap justify-center gap-24 rounded-lg">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger as-child>
                        <Button variant="outline">top</Button>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <p>top 방향 툴팁</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger as-child>
                        <Button variant="outline">right</Button>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <p>right 방향 툴팁</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger as-child>
                        <Button variant="outline">bottom</Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p>bottom 방향 툴팁</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger as-child>
                        <Button variant="outline">left</Button>
                      </TooltipTrigger>
                      <TooltipContent side="left">
                        <p>left 방향 툴팁</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </CardContent>

              <CardContent v-show="previewState['tooltip-side'] == 'code'">
                <CodeBlock
                  :code="`
<!-- side -->
<div class=&quot;rounded-lg flex flex-wrap gap-24 justify-center&quot;>
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger as-child>
        <Button variant=&quot;outline&quot;>top</Button>
      </TooltipTrigger>
      <TooltipContent side=&quot;top&quot;>
        <p>top 방향 툴팁</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger as-child>
        <Button variant=&quot;outline&quot;>right</Button>
      </TooltipTrigger>
      <TooltipContent side=&quot;right&quot;>
        <p>right 방향 툴팁</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger as-child>
        <Button variant=&quot;outline&quot;>bottom</Button>
      </TooltipTrigger>
      <TooltipContent side=&quot;bottom&quot;>
        <p>bottom 방향 툴팁</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger as-child>
        <Button variant=&quot;outline&quot;>left</Button>
      </TooltipTrigger>
      <TooltipContent side=&quot;left&quot;>
        <p>left 방향 툴팁</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
</div>
                  `" />
              </CardContent>
            </Card>
            <!-- 지연 시간 (delay-duration) -->
            <Card class="mb-24">
              <CardHeader>
                <div class="flex items-center justify-between">
                  <div>
                    <CardTitle>Tooltip 지연 시간</CardTitle>
                    <CardDescription>Tooltip 지연 시간 (delay-duration) 확인</CardDescription>
                  </div>
                  <div>
                    <SwitchSquare
                      class="content-end"
                      :options="[
                        { value: 'preview', label: 'Preview', icon: 'visibility' },
                        { value: 'code', label: 'Code', icon: 'integration_instructions' },
                      ]"
                      v-model="previewState['tooltip-delay']" />
                  </div>
                </div>
              </CardHeader>
              <CardContent v-show="previewState['tooltip-delay'] == 'preview'">
                <div class="flex flex-wrap justify-center gap-24 rounded-lg">
                  <TooltipProvider :delay-duration="0">
                    <Tooltip>
                      <TooltipTrigger as-child>
                        <Button variant="outline">즉시 (0ms)</Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>0 ms 후 표시</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider :delay-duration="700">
                    <Tooltip>
                      <TooltipTrigger as-child>
                        <Button variant="outline">700 ms</Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>700 ms 후 표시</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider :delay-duration="1500">
                    <Tooltip>
                      <TooltipTrigger as-child>
                        <Button variant="outline">1500 ms</Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>1500ms ms 후 표시</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </CardContent>

              <CardContent v-show="previewState['tooltip-delay'] == 'code'">
                <CodeBlock
                  :code="`
<!-- delay-duration -->
<div class=&quot;rounded-lg flex flex-wrap gap-24 justify-center&quot;>
  <TooltipProvider :delay-duration=&quot;0&quot;>
    <Tooltip>
      <TooltipTrigger as-child>
        <Button variant=&quot;outline&quot;>즉시 (0ms)</Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>0 ms 후 표시</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>

  <TooltipProvider :delay-duration=&quot;700&quot;>
    <Tooltip>
      <TooltipTrigger as-child>
        <Button variant=&quot;outline&quot;>700 ms</Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>700 ms 후 표시</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>

  <TooltipProvider :delay-duration=&quot;1500&quot;>
    <Tooltip>
      <TooltipTrigger as-child>
        <Button variant=&quot;outline&quot;>1500 ms</Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>1500ms ms 후 표시</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
</div>
                  `" />
              </CardContent>
            </Card>
          </div>
        </section>

        <section id="popoverSection" class="mb-24 rounded-md bg-white p-16">
          <h3 class="text-24 font-medium text-gray-800">Popover</h3>
          <div class="content mt-16">
            <!-- 기본 -->
            <Card class="mb-24">
              <CardHeader>
                <div class="flex items-center justify-between">
                  <div>
                    <CardTitle>Popover</CardTitle>
                  </div>
                  <div>
                    <SwitchSquare
                      class="content-end"
                      :options="[
                        { value: 'preview', label: 'Preview', icon: 'visibility' },
                        { value: 'code', label: 'Code', icon: 'integration_instructions' },
                      ]"
                      v-model="previewState['popover']" />
                  </div>
                </div>
              </CardHeader>
              <CardContent v-show="previewState['popover'] == 'preview'">
                <div class="flex gap-16">
                  <Popover>
                    <PopoverTrigger as-child>
                      <Button variant="outline">Open popover</Button>
                    </PopoverTrigger>
                    <PopoverContent>
                      <p>
                        Lorem ipsum dolor sit amet consectetur adipisicing elit. Sunt unde accusamus
                        suscipit eum dicta eos, sed fugit! Sed magni harum eos, veritatis impedit
                        porro, minima consectetur deleniti est qui dolorem.
                      </p>
                    </PopoverContent>
                  </Popover>

                  <Popover>
                    <PopoverTrigger as-child>
                      <Button variant="outline">너비 변경</Button>
                    </PopoverTrigger>
                    <PopoverContent class="w-350">
                      <p>
                        Lorem ipsum dolor sit amet consectetur adipisicing elit. Sunt unde accusamus
                        suscipit eum dicta eos, sed fugit! Sed magni harum eos, veritatis impedit
                        porro, minima consectetur deleniti est qui dolorem.
                      </p>
                    </PopoverContent>
                  </Popover>
                </div>
              </CardContent>

              <CardContent v-show="previewState['popover'] == 'code'">
                <CodeBlock
                  :code="`
<!-- Popover -->
<Popover>
  <PopoverTrigger as-child>
    <Button variant=&quot;outline&quot;> Open popover </Button>
  </PopoverTrigger>
  <PopoverContent>
    <p>
      Lorem ipsum dolor sit amet consectetur adipisicing elit. Sunt unde accusamus
      suscipit eum dicta eos, sed fugit! Sed magni harum eos, veritatis impedit
      porro, minima consectetur deleniti est qui dolorem.
    </p>
  </PopoverContent>
</Popover>

<!-- 너비 변경 -->
<Popover>
  <PopoverTrigger as-child>
    <Button variant=&quot;outline&quot;> 너비 변경 </Button>
  </PopoverTrigger>
  <PopoverContent class=&quot;w-300&quot;>
    <p>
      Lorem ipsum dolor sit amet consectetur adipisicing elit. Sunt unde accusamus
      suscipit eum dicta eos, sed fugit! Sed magni harum eos, veritatis impedit
      porro, minima consectetur deleniti est qui dolorem.
    </p>
  </PopoverContent>
</Popover>

                  `" />
              </CardContent>
            </Card>
          </div>
        </section>

        <section id="calendarSection" class="mb-24 rounded-md bg-white p-16">
          <h3 class="text-24 font-medium text-gray-800">Calendar</h3>
          <div class="content mt-16">
            <!-- 기본 -->
            <Card class="mb-24">
              <CardHeader>
                <div class="flex items-center justify-between">
                  <div>
                    <CardTitle>Calendar</CardTitle>
                    <CardDescription>일반 Calendar ui</CardDescription>
                  </div>
                  <div>
                    <SwitchSquare
                      class="content-end"
                      :options="[
                        { value: 'preview', label: 'Preview', icon: 'visibility' },
                        { value: 'code', label: 'Code', icon: 'integration_instructions' },
                      ]"
                      v-model="previewState['calendar']" />
                  </div>
                </div>
              </CardHeader>
              <CardContent v-show="previewState['calendar'] == 'preview'" class="bg-gray-50">
                <!--:is-date-unavailable=""-->
                <Calendar
                  :is-date-unavailable="isDateUnavailable"
                  :highlighted-dates="highlightedDates"
                  :min-value="new CalendarDate(2025, 12, 31)"
                  :max-value="new CalendarDate(2026, 6, 1)"
                  v-model="selectedDate" />
                <div class="p-12" />
                <Calendar
                  :is-date-unavailable="isDateUnavailable"
                  :highlighted-dates="highlightedDates"
                  layout="year"
                  locale="en-En"
                  format="YYYY-MM-DD"
                  v-model="selectedDate" />
              </CardContent>

              <CardContent v-show="previewState['calendar'] == 'code'">
                <CodeBlock
                  :code="`
<!--:is-date-unavailable=&quot;&quot;-->
<Calendar
  :is-date-unavailable=&quot;isDateUnavailable&quot;
  :highlighted-dates=&quot;highlightedDates&quot;
  :min-value=&quot;new CalendarDate(2025, 12, 31)&quot;
  :max-value=&quot;new CalendarDate(2026, 6, 1)&quot;
  v-model=&quot;selectedDate&quot; />
<div class=&quot;p-12&quot;></div>

<!--년/월 선택-->
<Calendar
  :is-date-unavailable=&quot;isDateUnavailable&quot;
  :highlighted-dates=&quot;highlightedDates&quot;
  layout=&quot;year&quot;
  locale=&quot;en-En&quot;
  format=&quot;YYYY-MM-DD&quot;
  v-model=&quot;selectedDate&quot; />

<script setup lang=&quot;ts&quot;>
  import { CalendarDate } from '@internationalized/date';
  import type { DateValue } from '@internationalized/date';

  const selectedDate = ref<DateValue>(new CalendarDate(2026, 3, 15));

  const unavailableDates = [new CalendarDate(2026, 3, 1), new CalendarDate(2026, 5, 5)];
  const isDateUnavailable = (date: DateValue) => unavailableDates.some(d => d.compare(date) === 0);

  // highlight할 날짜 목록
  const highlightedDates: DateValue[] = [
    new CalendarDate(2026, 3, 10),
    new CalendarDate(2026, 3, 20),
    new CalendarDate(2026, 4, 5),
  ];
</script>
                  `" />
              </CardContent>
            </Card>
            <!-- popover -->
            <Card class="mb-24">
              <CardHeader>
                <div class="flex items-center justify-between">
                  <div>
                    <CardTitle>Popover Calendar</CardTitle>
                    <CardDescription>Popover 형식의 Calendar ui</CardDescription>
                  </div>
                  <div>
                    <SwitchSquare
                      class="content-end"
                      :options="[
                        { value: 'preview', label: 'Preview', icon: 'visibility' },
                        { value: 'code', label: 'Code', icon: 'integration_instructions' },
                      ]"
                      v-model="previewState['popover-calendar']" />
                  </div>
                </div>
              </CardHeader>
              <CardContent v-show="previewState['popover-calendar'] == 'preview'">
                <div class="grid grid-cols-2 gap-16">
                  <!--PopoverCalendar-->
                  <PopoverCalendar
                    :is-date-unavailable="isDateUnavailable"
                    :highlighted-dates="highlightedDates"
                    layout="year"
                    locale="en-En"
                    :week-start-sun="true"
                    format="YYYY-MM-DD"
                    v-model="selectedDate" />

                  <PopoverCalendar
                    :is-date-unavailable="isDateUnavailable"
                    :highlighted-dates="highlightedDates"
                    :invalid="true"
                    invalid-message="필수값 입니다."
                    layout="year"
                    locale="en-En"
                    :week-start-sun="true"
                    format="YYYY-MM-DD"
                    v-model="selectedDate" />

                  <!--PopoverCalendar - 높이값 변경-->
                  <PopoverCalendar
                    size="sm"
                    format="yyyy년 mm월 dd일"
                    :is-date-unavailable="isDateUnavailable"
                    :highlighted-dates="highlightedDates"
                    :min-value="new CalendarDate(2025, 12, 31)"
                    :max-value="new CalendarDate(2026, 6, 1)"
                    v-model="selectedDate" />
                </div>
              </CardContent>

              <CardContent v-show="previewState['popover-calendar'] == 'code'">
                <CodeBlock
                  :code="`
<!--PopoverCalendar-->
<PopoverCalendar
  :is-date-unavailable=&quot;isDateUnavailable&quot;
  :highlighted-dates=&quot;highlightedDates&quot;
  layout=&quot;year&quot;
  locale=&quot;en-En&quot;
  format=&quot;YYYY-MM-DD&quot;
  v-model=&quot;selectedDate&quot; />

<!--PopoverCalendar sm-->
<PopoverCalendar
  :is-date-unavailable=&quot;isDateUnavailable&quot;
  :highlighted-dates=&quot;highlightedDates&quot;
  :min-value=&quot;new CalendarDate(2025, 12, 31)&quot;
  :max-value=&quot;new CalendarDate(2026, 6, 1)&quot;
  format=&quot;yyyy년 mm월 dd일&quot;
  v-model=&quot;selectedDate&quot; />

<script setup lang=&quot;ts&quot;>
  import { CalendarDate } from '@internationalized/date';
  import type { DateValue } from '@internationalized/date';

  const selectedDate = ref<DateValue>(new CalendarDate(2026, 3, 15));

  const unavailableDates = [new CalendarDate(2026, 3, 1), new CalendarDate(2026, 5, 5)];
  const isDateUnavailable = (date: DateValue) => unavailableDates.some(d => d.compare(date) === 0);

  // highlight할 날짜 목록
  const highlightedDates: DateValue[] = [
    new CalendarDate(2026, 3, 10),
    new CalendarDate(2026, 3, 20),
    new CalendarDate(2026, 4, 5),
  ];
</script>
                  `" />
              </CardContent>
            </Card>
            <!-- range -->
            <Card class="mb-24">
              <CardHeader>
                <div class="flex items-center justify-between">
                  <div>
                    <CardTitle>Range Calendar</CardTitle>
                    <CardDescription>Range Calendar ui</CardDescription>
                  </div>
                  <div>
                    <SwitchSquare
                      class="content-end"
                      :options="[
                        { value: 'preview', label: 'Preview', icon: 'visibility' },
                        { value: 'code', label: 'Code', icon: 'integration_instructions' },
                      ]"
                      v-model="previewState['range-calendar']" />
                  </div>
                </div>
              </CardHeader>
              <CardContent v-show="previewState['range-calendar'] == 'preview'">
                <div class="grid grid-cols-2 gap-16">
                  <div>
                    <!-- RangeCalendar -->
                    <RangeCalendar class="rounded-md border" v-model="selectedRangeDate" />
                    <p class="mt-8 text-sm text-muted-foreground">{{ selectedRangeDate }}</p>
                  </div>
                  <div>
                    <!-- Popover RangeCalendar -->
                    <PopoverCalendar
                      size="lg"
                      :range="true"
                      layout="year_month"
                      format="yyyy년 mm월 dd일"
                      v-model="selectedRangeDate" />
                    <p class="mt-8 text-sm text-muted-foreground">{{ selectedRangeDate }}</p>
                  </div>
                </div>
              </CardContent>
              <CardContent v-show="previewState['range-calendar'] == 'code'">
                <CodeBlock
                  :code="`
<!-- RangeCalendar -->
<RangeCalendar v-model=&quot;selectedRangeDate&quot; class=&quot;rounded-md border&quot; />

<!-- Popover RangeCalendar -->
<PopoverCalendar
  size=&quot;lg&quot;
  :range=&quot;true&quot;
  v-model=&quot;selectedRangeDate&quot;
  layout=&quot;year_month&quot;
  format=&quot;yyyy년 mm월 dd일&quot; />
                `" />
              </CardContent>
            </Card>
          </div>
        </section>

        <section id="accordionSection" class="mb-24 rounded-md bg-white p-16">
          <h3 class="text-24 font-medium text-gray-800">Accordion</h3>
          <div class="content mt-16">
            <!-- 기본 -->
            <Card class="mb-24">
              <CardHeader>
                <div class="flex items-center justify-between">
                  <div>
                    <CardTitle>Accordion</CardTitle>
                  </div>
                  <div>
                    <SwitchSquare
                      class="content-end"
                      :options="[
                        { value: 'preview', label: 'Preview', icon: 'visibility' },
                        { value: 'code', label: 'Code', icon: 'integration_instructions' },
                      ]"
                      v-model="previewState['accordion']" />
                  </div>
                </div>
              </CardHeader>
              <CardContent v-show="previewState['accordion'] == 'preview'">
                <div class="rounded-md border p-8">
                  <Accordion type="single" collapsible default-value="menu-1">
                    <AccordionItem value="menu-1">
                      <AccordionTrigger class="px-8">menu 01</AccordionTrigger>
                      <AccordionContent>
                        <ul class="bg-gray-100 py-8">
                          <li>
                            <NuxtLink
                              to="/"
                              active-class="!text-primary "
                              class="block px-8 py-8 text-[16px] hover:font-medium hover:text-primary focus:font-medium focus:text-primary">
                              menu 01_01
                            </NuxtLink>
                          </li>
                          <li>
                            <NuxtLink
                              to="/"
                              active-class="!text-primary "
                              class="block px-8 py-8 text-[16px] hover:font-medium hover:text-primary focus:font-medium focus:text-primary">
                              menu 01_02
                            </NuxtLink>
                          </li>
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="menu-2">
                      <AccordionTrigger class="px-8">menu 02</AccordionTrigger>
                      <AccordionContent>
                        <ul class="bg-gray-100 py-8">
                          <li>
                            <NuxtLink
                              to="/"
                              active-class="!text-primary "
                              class="block px-8 py-8 text-[16px] hover:font-medium hover:text-primary focus:font-medium focus:text-primary">
                              menu 02_01
                            </NuxtLink>
                          </li>
                          <li>
                            <NuxtLink
                              to="/"
                              active-class="!text-primary "
                              class="block px-8 py-8 text-[16px] hover:font-medium hover:text-primary focus:font-medium focus:text-primary">
                              menu 02_02
                            </NuxtLink>
                          </li>
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              </CardContent>

              <CardContent v-show="previewState['accordion'] == 'code'">
                <CodeBlock
                  :code="`
<!-- Accordion -->
<div class=&quot;border p-8 rounded-md&quot;>
  <Accordion type=&quot;single&quot; collapsible defaultValue=&quot;menu-1&quot;>
    <AccordionItem value=&quot;menu-1&quot;>
      <AccordionTrigger class=&quot;px-8&quot;>menu 01</AccordionTrigger>
      <AccordionContent>
        <ul class=&quot;py-8 bg-gray-100&quot;>
          <li>
            <NuxtLink
              to=&quot;/&quot;
              active-class=&quot;!text-primary &quot;
              class=&quot;block py-8 px-8 text-[16px] hover:font-medium hover:text-primary focus:font-medium focus:text-primary&quot;
              >menu 01_01</NuxtLink
            >
          </li>
          <li>
            <NuxtLink
              to=&quot;/&quot;
              active-class=&quot;!text-primary &quot;
              class=&quot;block py-8 px-8 text-[16px] hover:font-medium hover:text-primary focus:font-medium focus:text-primary&quot;
              >menu 01_02</NuxtLink
            >
          </li>
        </ul>
      </AccordionContent>
    </AccordionItem>
    <AccordionItem value=&quot;menu-2&quot;>
      <AccordionTrigger class=&quot;px-8&quot;>menu 02</AccordionTrigger>
      <AccordionContent>
        <ul class=&quot;py-8 bg-gray-100&quot;>
          <li>
            <NuxtLink
              to=&quot;/&quot;
              active-class=&quot;!text-primary &quot;
              class=&quot;block py-8 px-8 text-[16px] hover:font-medium hover:text-primary focus:font-medium focus:text-primary&quot;
              >menu 02_01</NuxtLink
            >
          </li>
          <li>
            <NuxtLink
              to=&quot;/&quot;
              active-class=&quot;!text-primary &quot;
              class=&quot;block py-8 px-8 text-[16px] hover:font-medium hover:text-primary focus:font-medium focus:text-primary&quot;
              >menu 02_02</NuxtLink
            >
          </li>
        </ul>
      </AccordionContent>
    </AccordionItem>
  </Accordion>
</div>

                  `" />
              </CardContent>
            </Card>
          </div>
        </section>

        <section id="navigationSection" class="mb-24 rounded-md bg-white p-16">
          <h3 class="text-24 font-medium text-gray-800">Navigation</h3>
          <div class="content mt-16">
            <!-- 기본 -->
            <Card class="mb-24">
              <CardHeader>
                <div class="flex items-center justify-between">
                  <div>
                    <CardTitle>Navigation</CardTitle>
                  </div>
                  <div>
                    <SwitchSquare
                      class="content-end"
                      :options="[
                        { value: 'preview', label: 'Preview', icon: 'visibility' },
                        { value: 'code', label: 'Code', icon: 'integration_instructions' },
                      ]"
                      v-model="previewState['navigation']" />
                  </div>
                </div>
              </CardHeader>
              <CardContent v-show="previewState['navigation'] == 'preview'">
                <NavigationMenu>
                  <NavigationMenuList>
                    <!-- 드롭다운 메뉴 -->
                    <NavigationMenuItem class="mx-20">
                      <NavigationMenuTrigger>menu 01</NavigationMenuTrigger>
                      <NavigationMenuContent class="w-[150px] gap-4">
                        <NavigationMenuLink as-child>
                          <NuxtLink
                            to="/01_01"
                            active-class="!text-primary !opacity-100 !font-medium"
                            class="block px-16 py-8 font-normal text-[#455c73] opacity-80 hover:opacity-100 focus:opacity-100">
                            menu 01_01
                          </NuxtLink>
                        </NavigationMenuLink>

                        <NavigationMenuLink as-child>
                          <NuxtLink
                            to="/01_02"
                            active-class="!text-primary !opacity-100 !font-medium"
                            class="block px-16 py-8 font-normal text-[#455c73] opacity-80 hover:opacity-100 focus:opacity-100">
                            menu 01_02
                          </NuxtLink>
                        </NavigationMenuLink>

                        <NavigationMenuLink as-child>
                          <NuxtLink
                            to="/01_03"
                            active-class="!text-primary !opacity-100 !font-medium"
                            class="block px-16 py-8 font-normal text-[#455c73] opacity-80 hover:opacity-100 focus:opacity-100">
                            menu 01_03
                          </NuxtLink>
                        </NavigationMenuLink>
                      </NavigationMenuContent>
                    </NavigationMenuItem>

                    <!-- 단순 링크 메뉴 -->
                    <NavigationMenuItem class="mx-20">
                      <NavigationMenuLink as-child>
                        <NuxtLink
                          to="/"
                          active-class="!text-primary !opacity-100 !font-medium"
                          :class="navigationMenuTriggerStyle()">
                          <span class="relative">
                            <span class="invisible font-medium" aria-hidden="true">menu 02</span>
                            <span class="absolute inset-0 flex items-center">menu 02</span>
                          </span>
                        </NuxtLink>
                      </NavigationMenuLink>
                    </NavigationMenuItem>

                    <!-- 드롭다운 메뉴 2 -->
                    <NavigationMenuItem class="mx-20">
                      <NavigationMenuTrigger>menu 03</NavigationMenuTrigger>
                      <NavigationMenuContent class="w-fit grid-cols-2 gap-0">
                        <NavigationMenuLink as-child>
                          <NuxtLink
                            to="/03_01"
                            active-class="!text-primary !opacity-100 !font-medium"
                            class="block px-16 py-8 font-normal text-[#455c73] opacity-80 hover:opacity-100 focus:opacity-100">
                            menu 03_01
                          </NuxtLink>
                        </NavigationMenuLink>

                        <NavigationMenuLink as-child>
                          <NuxtLink
                            to="/03_02"
                            active-class="!text-primary !opacity-100 !font-medium"
                            class="block px-16 py-8 font-normal text-[#455c73] opacity-80 hover:opacity-100 focus:opacity-100">
                            menu 03_02
                          </NuxtLink>
                        </NavigationMenuLink>

                        <NavigationMenuLink as-child>
                          <NuxtLink
                            to="/03_03"
                            active-class="!text-primary !opacity-100 !font-medium"
                            class="block px-16 py-8 font-normal text-[#455c73] opacity-80 hover:opacity-100 focus:opacity-100">
                            menu 03_03
                          </NuxtLink>
                        </NavigationMenuLink>

                        <NavigationMenuLink as-child>
                          <NuxtLink
                            to="/03_04"
                            active-class="!text-primary !opacity-100 !font-medium"
                            class="block px-16 py-8 font-normal text-[#455c73] opacity-80 hover:opacity-100 focus:opacity-100">
                            menu 03_04
                          </NuxtLink>
                        </NavigationMenuLink>
                      </NavigationMenuContent>
                    </NavigationMenuItem>
                  </NavigationMenuList>
                </NavigationMenu>
              </CardContent>
              <CardContent v-show="previewState['navigation'] == 'code'">
                <CodeBlock
                  :code="`
<!-- NavigationMenu -->
<NavigationMenu>
  <NavigationMenuList>
    <!-- 드롭다운 메뉴 -->
    <NavigationMenuItem class=&quot;mx-20&quot;>
      <NavigationMenuTrigger>menu 01</NavigationMenuTrigger>
      <NavigationMenuContent class=&quot;w-[150px] gap-4&quot;>
        <NavigationMenuLink as-child>
          <NuxtLink
            to=&quot;/01_01&quot;
            active-class=&quot;!text-primary !opacity-100 !font-medium&quot;
            class=&quot;block px-16 py-8 font-normal text-[#455c73] opacity-80 hover:opacity-100 focus:opacity-100&quot;>
            menu 01_01
          </NuxtLink>
        </NavigationMenuLink>

        <NavigationMenuLink as-child>
          <NuxtLink
            to=&quot;/01_02&quot;
            active-class=&quot;!text-primary !opacity-100 !font-medium&quot;
            class=&quot;block px-16 py-8 font-normal text-[#455c73] opacity-80 hover:opacity-100 focus:opacity-100&quot;>
            menu 01_02
          </NuxtLink>
        </NavigationMenuLink>

        <NavigationMenuLink as-child>
          <NuxtLink
            to=&quot;/01_03&quot;
            active-class=&quot;!text-primary !opacity-100 !font-medium&quot;
            class=&quot;block px-16 py-8 font-normal text-[#455c73] opacity-80 hover:opacity-100 focus:opacity-100&quot;>
            menu 01_03
          </NuxtLink>
        </NavigationMenuLink>
      </NavigationMenuContent>
    </NavigationMenuItem>

    <!-- 단순 링크 메뉴 -->
    <NavigationMenuItem class=&quot;mx-20&quot;>
      <NavigationMenuLink as-child>
        <NuxtLink
          to=&quot;/&quot;
          active-class=&quot;!text-primary !opacity-100 !font-medium&quot;
          :class=&quot;navigationMenuTriggerStyle()&quot;>
          <span class=&quot;relative&quot;>
            <span class=&quot;invisible font-medium&quot; aria-hidden=&quot;true&quot;>menu 02</span>
            <span class=&quot;absolute inset-0 flex items-center&quot;>menu 02</span>
          </span>
        </NuxtLink>
      </NavigationMenuLink>
    </NavigationMenuItem>

    <!-- 드롭다운 메뉴 2 -->
    <NavigationMenuItem class=&quot;mx-20&quot;>
      <NavigationMenuTrigger>menu 03</NavigationMenuTrigger>
      <NavigationMenuContent class=&quot;w-fit grid-cols-2 gap-0&quot;>
        <NavigationMenuLink as-child>
          <NuxtLink
            to=&quot;/03_01&quot;
            active-class=&quot;!text-primary !opacity-100 !font-medium&quot;
            class=&quot;block px-16 py-8 font-normal text-[#455c73] opacity-80 hover:opacity-100 focus:opacity-100&quot;>
            menu 03_01
          </NuxtLink>
        </NavigationMenuLink>

        <NavigationMenuLink as-child>
          <NuxtLink
            to=&quot;/03_02&quot;
            active-class=&quot;!text-primary !opacity-100 !font-medium&quot;
            class=&quot;block px-16 py-8 font-normal text-[#455c73] opacity-80 hover:opacity-100 focus:opacity-100&quot;>
            menu 03_02
          </NuxtLink>
        </NavigationMenuLink>

        <NavigationMenuLink as-child>
          <NuxtLink
            to=&quot;/03_03&quot;
            active-class=&quot;!text-primary !opacity-100 !font-medium&quot;
            class=&quot;block px-16 py-8 font-normal text-[#455c73] opacity-80 hover:opacity-100 focus:opacity-100&quot;>
            menu 03_03
          </NuxtLink>
        </NavigationMenuLink>

        <NavigationMenuLink as-child>
          <NuxtLink
            to=&quot;/03_04&quot;
            active-class=&quot;!text-primary !opacity-100 !font-medium&quot;
            class=&quot;block px-16 py-8 font-normal text-[#455c73] opacity-80 hover:opacity-100 focus:opacity-100&quot;>
            menu 03_04
          </NuxtLink>
        </NavigationMenuLink>
      </NavigationMenuContent>
    </NavigationMenuItem>
  </NavigationMenuList>
</NavigationMenu>

<script setup lang=&quot;ts&quot;>
  const navComponents: { title: string; href: string; description: string }[] = [
    {
      title: '주요 기능',
      href: '#',
      description: '핵심 서비스 기능을 한눈에 확인하세요.',
    },
    {
      title: '요금 안내',
      href: '#',
      description: '합리적인 가격으로 원하는 플랜을 선택하세요.',
    },
    {
      title: '파트너십',
      href: '#',
      description: '함께 성장할 파트너를 모집합니다.',
    },
    {
      title: '회사 소개',
      href: '#',
      description: '저희 팀과 미션에 대해 알아보세요.',
    },
  ];
</script>
                  `" />
              </CardContent>
            </Card>
          </div>
        </section>

        <section id="breadcrumbSection" class="mb-24 rounded-md bg-white p-16">
          <h3 class="text-24 font-medium text-gray-800">Breadcrumb</h3>
          <div class="content mt-16">
            <!-- 기본 -->
            <Card class="mb-24">
              <CardHeader>
                <div class="flex items-center justify-between">
                  <div>
                    <CardTitle>Breadcrumb</CardTitle>
                  </div>
                  <div>
                    <SwitchSquare
                      class="content-end"
                      :options="[
                        { value: 'preview', label: 'Preview', icon: 'visibility' },
                        { value: 'code', label: 'Code', icon: 'integration_instructions' },
                      ]"
                      v-model="previewState['breadcrumb']" />
                  </div>
                </div>
              </CardHeader>
              <CardContent v-show="previewState['breadcrumb'] == 'preview'">
                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem>
                      <BreadcrumbLink href="/">Home</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbLink href="/components">Components</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
              </CardContent>
              <CardContent v-show="previewState['breadcrumb'] == 'code'">
                <CodeBlock
                  :code="`
<Breadcrumb>
  <BreadcrumbList>
    <BreadcrumbItem>
      <BreadcrumbLink href=&quot;/&quot;>Home</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbLink href=&quot;/components&quot;>Components</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
    </BreadcrumbItem>
  </BreadcrumbList>
</Breadcrumb>
                  `" />
              </CardContent>
            </Card>
          </div>
        </section>

        <section id="paginationSection" class="mb-24 rounded-md bg-white p-16">
          <h3 class="text-24 font-medium text-gray-800">Pagination</h3>
          <div class="content mt-16">
            <!-- 기본 -->
            <Card class="mb-24">
              <CardHeader>
                <div class="flex items-center justify-between">
                  <div>
                    <CardTitle>Pagination</CardTitle>
                  </div>
                  <div>
                    <SwitchSquare
                      class="content-end"
                      :options="[
                        { value: 'preview', label: 'Preview', icon: 'visibility' },
                        { value: 'code', label: 'Code', icon: 'integration_instructions' },
                      ]"
                      v-model="previewState['pagination']" />
                  </div>
                </div>
              </CardHeader>
              <CardContent v-show="previewState['pagination'] == 'preview'">
                <div class="space-y-24">
                  <!-- 기본 (엣지 포함) -->
                  <div>
                    <p class="mb-12 text-sm font-medium text-gray-500">기본 (show-edges)</p>
                    <Pagination
                      :total="500"
                      :items-per-page="10"
                      :sibling-count="1"
                      show-edges
                      v-model:page="page1">
                      <PaginationList v-slot="{ items }">
                        <PaginationFirst />
                        <PaginationPrev />
                        <template :key="index" v-for="(item, index) in items">
                          <PaginationListItem
                            v-if="item.type === 'page'"
                            :value="item.value"
                            as-child>
                            <Button
                              :variant="item.value === page1 ? 'primary' : 'outline-primary-2'"
                              size="icon-sm">
                              {{ item.value }}
                            </Button>
                          </PaginationListItem>
                          <PaginationEllipsis v-else />
                        </template>
                        <PaginationNext />
                        <PaginationLast />
                      </PaginationList>
                    </Pagination>
                    <p class="text-sm text-gray-500">현재 페이지: {{ page1 }}</p>
                  </div>

                  <!-- 엣지 없음 -->
                  <div>
                    <p class="mb-12 text-sm font-medium text-gray-500">엣지 없음</p>
                    <Pagination
                      :total="50"
                      :items-per-page="1"
                      :sibling-count="1"
                      v-model:page="page2">
                      <PaginationList v-slot="{ items }">
                        <PaginationPrev />
                        <template :key="index" v-for="(item, index) in items">
                          <PaginationListItem
                            v-if="item.type === 'page'"
                            :value="item.value"
                            as-child>
                            <Button
                              :variant="item.value === page2 ? 'primary' : 'outline-primary-2'"
                              size="icon-sm">
                              {{ item.value }}
                            </Button>
                          </PaginationListItem>
                          <PaginationEllipsis v-else />
                        </template>
                        <PaginationNext />
                      </PaginationList>
                    </Pagination>
                    <p class="text-sm text-gray-500">현재 페이지: {{ page2 }}</p>
                  </div>
                </div>
              </CardContent>
              <CardContent v-show="previewState['pagination'] == 'code'">
                <CodeBlock
                  :code="`
<!-- 기본 (엣지 포함) -->
<div>
  <p class=&quot;mb-12 text-sm font-medium text-gray-500&quot;>기본 (show-edges)</p>
  <Pagination :total=&quot;50&quot; :items-per-page=&quot;10&quot; :sibling-count=&quot;1&quot; show-edges v-model:page=&quot;page1&quot;>
    <PaginationList v-slot=&quot;{ items }&quot;>
      <PaginationFirst />
      <PaginationPrev />
      <template v-for=&quot;(item, index) in items&quot; :key=&quot;index&quot;>
        <PaginationListItem
          v-if=&quot;item.type === 'page'&quot;
          :value=&quot;item.value&quot;
          as-child>
          <Button
            :variant=&quot;item.value === page1 ? 'primary' : 'outline-primary-2'&quot;
            size=&quot;icon-sm&quot;>
            {{ item.value }}
          </Button>
        </PaginationListItem>
        <PaginationEllipsis v-else />
      </template>
      <PaginationNext />
      <PaginationLast />
    </PaginationList>
  </Pagination>
  <p class=&quot;text-sm text-gray-500&quot;>현재 페이지: {{ page1 }}</p>
</div>

<!-- 엣지 없음 -->
<div>
  <p class=&quot;mb-12 text-sm font-medium text-gray-500&quot;>엣지 없음</p>
  <Pagination :total=&quot;50&quot; :items-per-page=&quot;10&quot; :sibling-count=&quot;1&quot; v-model:page=&quot;page2&quot;>
    <PaginationList v-slot=&quot;{ items }&quot;>
      <PaginationPrev />
      <template v-for=&quot;(item, index) in items&quot; :key=&quot;index&quot;>
        <PaginationListItem
          v-if=&quot;item.type === 'page'&quot;
          :value=&quot;item.value&quot;
          as-child>
          <Button
            :variant=&quot;item.value === page1 ? 'primary' : 'outline-primary-2'&quot;
            size=&quot;icon-sm&quot;>
            {{ item.value }}
          </Button>
        </PaginationListItem>
        <PaginationEllipsis v-else />
      </template>
      <PaginationNext />
    </PaginationList>
  </Pagination>
  <p class=&quot;text-sm text-gray-500&quot;>현재 페이지: {{ page2 }}</p>
</div>
                `" />
              </CardContent>
            </Card>
          </div>
        </section>

        <section id="switchSection" class="mb-24 rounded-md bg-white p-16">
          <h3 class="text-24 font-medium text-gray-800">Switch</h3>
          <div class="content mt-16">
            <!-- 기본 -->
            <Card class="mb-24">
              <CardHeader>
                <div class="flex items-center justify-between">
                  <div>
                    <CardTitle>Switch</CardTitle>
                    <CardDescription>Switch 기본 ui</CardDescription>
                  </div>
                  <div>
                    <SwitchSquare
                      class="content-end"
                      :options="[
                        { value: 'preview', label: 'Preview', icon: 'visibility' },
                        { value: 'code', label: 'Code', icon: 'integration_instructions' },
                      ]"
                      v-model="previewState['switch']" />
                  </div>
                </div>
              </CardHeader>
              <CardContent v-show="previewState['switch'] == 'preview'">
                <div class="flex flex-col gap-16">
                  <!-- 기본 Switch -->
                  <SwitchField>
                    <template #switch>
                      <Switch id="switch-1" v-model="switchBasic" />
                    </template>
                    <label for="switch-1" class="text-14 text-gray-700">기본 스위치</label>
                  </SwitchField>

                  <!-- 라벨 포함 Switch -->
                  <SwitchField>
                    <template #switch>
                      <Switch id="switch-2" v-model="switchLabel" />
                    </template>
                    <label for="switch-2" class="text-14 text-gray-700">
                      알림 수신 동의
                      <p class="text-12 font-normal text-gray-400">
                        이메일과 SMS로 알림을 받습니다.
                      </p>
                    </label>
                  </SwitchField>

                  <!-- 비활성 Switch -->
                  <SwitchField>
                    <template #switch>
                      <Switch id="switch-3" :default-value="true" disabled />
                    </template>
                    <label for="switch-3" class="text-14 text-gray-400">비활성 (켜짐)</label>
                  </SwitchField>
                  <SwitchField>
                    <template #switch>
                      <Switch id="switch-4" :default-value="false" disabled />
                    </template>
                    <label for="switch-4" class="text-14 text-gray-400">비활성 (꺼짐)</label>
                  </SwitchField>
                </div>
              </CardContent>

              <CardContent v-show="previewState['switch'] == 'code'">
                <CodeBlock
                  :code="`
<!-- 기본 Switch -->
<SwitchField>
  <template #switch>
    <Switch id=&quot;switch-1&quot; v-model=&quot;switchBasic&quot; />
  </template>
  <label for=&quot;switch-1&quot; class=&quot;text-14 text-gray-700&quot;>기본 스위치</label>
</SwitchField>

<!-- 라벨 포함 Switch -->
<SwitchField>
  <template #switch>
    <Switch id=&quot;switch-2&quot; v-model=&quot;switchLabel&quot; />
  </template>
  <label for=&quot;switch-2&quot; class=&quot;text-14 text-gray-700&quot;>
    알림 수신 동의
    <p class=&quot;text-12 font-normal text-gray-400&quot;>
      이메일과 SMS로 알림을 받습니다.
    </p>
  </label>
</SwitchField>

<!-- 비활성 Switch -->
<SwitchField>
  <template #switch>
    <Switch id=&quot;switch-3&quot; :default-value=&quot;true&quot; disabled />
  </template>
  <label for=&quot;switch-3&quot; class=&quot;text-14 text-gray-400&quot;>비활성 (켜짐)</label>
</SwitchField>
<SwitchField>
  <template #switch>
    <Switch id=&quot;switch-4&quot; :default-value=&quot;false&quot; disabled />
  </template>
  <label for=&quot;switch-4&quot; class=&quot;text-14 text-gray-400&quot;>비활성 (꺼짐)</label>
</SwitchField>
                  `" />
              </CardContent>
            </Card>
            <!-- SwitchSquare -->
            <Card class="mb-24">
              <CardHeader>
                <div class="flex items-center justify-between">
                  <div>
                    <CardTitle>Switch Square</CardTitle>
                    <CardDescription>Switch Square ui</CardDescription>
                  </div>
                  <div>
                    <SwitchSquare
                      class="content-end"
                      :options="[
                        { value: 'preview', label: 'Preview', icon: 'visibility' },
                        { value: 'code', label: 'Code', icon: 'integration_instructions' },
                      ]"
                      v-model="previewState['switch-square']" />
                  </div>
                </div>
              </CardHeader>
              <CardContent v-show="previewState['switch-square'] == 'preview'">
                <div class="flex flex-col gap-20">
                  <!-- Preview / Code 토글 -->
                  <div>
                    <p class="mb-8 text-12 text-gray-500">Preview / Code 전환</p>
                    <SwitchSquare
                      :options="[
                        { value: 'preview', label: 'Preview', icon: 'visibility' },
                        { value: 'code', label: 'Code', icon: 'integration_instructions' },
                      ]"
                      v-model="switchSquareView" />
                    <p class="mt-8 text-sm text-muted-foreground">현재: {{ switchSquareView }}</p>
                  </div>

                  <!-- 아이콘 없이 -->
                  <div>
                    <p class="mb-8 text-12 text-gray-500">아이콘 없는 토글</p>
                    <SwitchSquare
                      :options="[
                        { value: 'list', label: '목록' },
                        { value: 'grid', label: '그리드' },
                      ]"
                      v-model="switchSquareMode" />
                    <p class="mt-8 text-sm text-muted-foreground">현재: {{ switchSquareMode }}</p>
                  </div>

                  <!-- 아이콘만 -->
                  <div>
                    <p class="mb-8 text-12 text-gray-500">아이콘만 있는 토글</p>
                    <SwitchSquare
                      :options="[
                        { value: 'list', label: '', icon: 'format_list_bulleted' },
                        { value: 'grid', label: '', icon: 'grid_view' },
                      ]"
                      v-model="switchSquareLayout" />
                    <p class="mt-8 text-sm text-muted-foreground">현재: {{ switchSquareLayout }}</p>
                  </div>
                </div>
              </CardContent>
              <CardContent v-show="previewState['switch-square'] == 'code'">
                <CodeBlock
                  :code="`
<!-- Preview / Code 토글 -->
<div>
  <p class=&quot;text-12 text-gray-500 mb-8&quot;>Preview / Code 전환</p>
  <SwitchSquare
    v-model=&quot;switchSquareView&quot;
    :options=&quot;[
      { value: &#39;preview&#39;, label: &#39;Preview&#39;, icon: &#39;visibility&#39; },
      { value: &#39;code&#39;, label: &#39;Code&#39;, icon: &#39;integration_instructions&#39; },
    ]&quot;
  />
  <p class=&quot;mt-8 text-sm text-muted-foreground&quot;>현재: {{ switchSquareView }}</p>
</div>

<!-- 아이콘 없이 -->
<div>
  <p class=&quot;text-12 text-gray-500 mb-8&quot;>아이콘 없는 토글</p>
  <SwitchSquare
    v-model=&quot;switchSquareMode&quot;
    :options=&quot;[
      { value: &#39;list&#39;, label: &#39;목록&#39; },
      { value: &#39;grid&#39;, label: &#39;그리드&#39; },
    ]&quot;
  />
  <p class=&quot;mt-8 text-sm text-muted-foreground&quot;>현재: {{ switchSquareMode }}</p>
</div>

<!-- 아이콘만 -->
<div>
  <p class=&quot;text-12 text-gray-500 mb-8&quot;>아이콘만 있는 토글</p>
  <SwitchSquare
    v-model=&quot;switchSquareLayout&quot;
    :options=&quot;[
      { value: &#39;list&#39;, label: &#39;&#39;, icon: &#39;format_list_bulleted&#39; },
      { value: &#39;grid&#39;, label: &#39;&#39;, icon: &#39;grid_view&#39; },
    ]&quot;
  />
  <p class=&quot;mt-8 text-sm text-muted-foreground&quot;>현재: {{ switchSquareLayout }}</p>
</div>

<script setup lang=&quot;ts&quot;>
  // Switch
  const switchBasic = ref(false);
  const switchLabel = ref(true);

  // SwitchSquare
  const switchSquareView = ref('preview');
  const switchSquareMode = ref('list');
  const switchSquareLayout = ref('list');
</script>
                  `" />
              </CardContent>
            </Card>
          </div>
        </section>

        <section id="stepperSection" class="mb-24 rounded-md bg-white p-16">
          <h3 class="text-24 font-medium text-gray-800">Stepper</h3>
          <div class="content mt-16">
            <!-- 기본 -->
            <Card class="mb-24">
              <CardHeader>
                <div class="flex items-center justify-between">
                  <div>
                    <CardTitle>Stepper</CardTitle>
                  </div>
                  <div>
                    <SwitchSquare
                      class="content-end"
                      :options="[
                        { value: 'preview', label: 'Preview', icon: 'visibility' },
                        { value: 'code', label: 'Code', icon: 'integration_instructions' },
                      ]"
                      v-model="previewState['stepper']" />
                  </div>
                </div>
              </CardHeader>
              <CardContent v-show="previewState['stepper'] == 'preview'">
                <div class="content mt-16">
                  <div class="mb-16">
                    <Stepper>
                      <StepperItem :step="1">
                        <StepperTrigger>
                          <StepperIndicator>1</StepperIndicator>
                          <StepperTitle>Step 1</StepperTitle>
                          <StepperDescription>This is the first step</StepperDescription>
                        </StepperTrigger>
                        <StepperSeparator />
                      </StepperItem>
                      <StepperItem :step="2">
                        <StepperTrigger>
                          <StepperIndicator>2</StepperIndicator>
                          <StepperTitle>Step 2</StepperTitle>
                          <StepperDescription>This is the second step ehkehekh</StepperDescription>
                        </StepperTrigger>
                        <StepperSeparator />
                      </StepperItem>
                      <StepperItem :step="3">
                        <StepperTrigger>
                          <StepperIndicator>3</StepperIndicator>
                          <StepperTitle>Step 3</StepperTitle>
                          <StepperDescription>
                            ehkeh ehke hekhe e heke hek h is the thrid step
                          </StepperDescription>
                        </StepperTrigger>
                        <StepperSeparator />
                      </StepperItem>
                      <StepperItem :step="4">
                        <StepperTrigger>
                          <StepperIndicator>3</StepperIndicator>
                          <StepperTitle>Step 3</StepperTitle>
                          <StepperDescription>
                            ehkeh ehke hekhe e heke hek h is the thrid step
                          </StepperDescription>
                        </StepperTrigger>
                      </StepperItem>
                    </Stepper>
                  </div>
                  <div class="mb-16">
                    <Stepper>
                      <StepperItem :step="1">
                        <StepperTrigger>
                          <StepperIndicator>1</StepperIndicator>
                          <StepperTitle>Step 1</StepperTitle>
                          <StepperDescription></StepperDescription>
                        </StepperTrigger>
                        <StepperSeparator />
                      </StepperItem>
                      <StepperItem :step="2">
                        <StepperTrigger>
                          <StepperIndicator>2</StepperIndicator>
                          <StepperTitle>Step 2</StepperTitle>
                          <StepperDescription></StepperDescription>
                        </StepperTrigger>
                        <StepperSeparator />
                      </StepperItem>
                      <StepperItem :step="3">
                        <StepperTrigger>
                          <StepperIndicator>3</StepperIndicator>
                          <StepperTitle>Step 3</StepperTitle>
                          <StepperDescription></StepperDescription>
                        </StepperTrigger>
                      </StepperItem>
                    </Stepper>
                  </div>
                  <div class="w-200">
                    <p>vertical + stepMove: false</p>
                    <Stepper :stepMove="false" orientation="vertical">
                      <StepperItem :step="1">
                        <StepperTrigger>
                          <StepperIndicator>1</StepperIndicator>
                          <StepperTitle>Step 1</StepperTitle>
                          <StepperDescription>This is the first step</StepperDescription>
                        </StepperTrigger>
                        <StepperSeparator />
                      </StepperItem>
                      <StepperItem :step="2">
                        <StepperTrigger>
                          <StepperIndicator>2</StepperIndicator>
                          <StepperTitle>Step 2</StepperTitle>
                          <StepperDescription>
                            hkeh ehke hekhe e heke hek h is the thrid stephkeh ehke hekhe e heke hek
                            h is the thrid step
                          </StepperDescription>
                        </StepperTrigger>
                        <StepperSeparator />
                      </StepperItem>
                      <StepperItem :step="3">
                        <StepperTrigger>
                          <StepperIndicator>3</StepperIndicator>
                          <StepperTitle>Step 3</StepperTitle>
                          <StepperDescription>This is the thrid step</StepperDescription>
                        </StepperTrigger>
                      </StepperItem>
                    </Stepper>
                  </div>
                </div>
              </CardContent>
              <CardContent v-show="previewState['stepper'] == 'code'">
                <CodeBlock
                  :code="`
// 일반 stepper
<Stepper>
  <StepperItem :step=&quot;1&quot;>
    <StepperTrigger>
      <StepperIndicator>1</StepperIndicator>
      <StepperTitle>Step 1</StepperTitle>
      <StepperDescription>This is the first step</StepperDescription>
    </StepperTrigger>
    <StepperSeparator />
  </StepperItem>
  <StepperItem :step=&quot;2&quot;>
    <StepperTrigger>
      <StepperIndicator>2</StepperIndicator>
      <StepperTitle>Step 2</StepperTitle>
      <StepperDescription>This is the second step ehkehekh</StepperDescription>
    </StepperTrigger>
    <StepperSeparator />
  </StepperItem>
  <StepperItem :step=&quot;3&quot;>
    <StepperTrigger>
      <StepperIndicator>3</StepperIndicator>
      <StepperTitle>Step 3</StepperTitle>
      <StepperDescription>
        ehkeh ehke hekhe e heke hek h is the thrid step
      </StepperDescription>
    </StepperTrigger>
    <StepperSeparator />
  </StepperItem>
  <StepperItem :step=&quot;4&quot;>
    <StepperTrigger>
      <StepperIndicator>3</StepperIndicator>
      <StepperTitle>Step 3</StepperTitle>
      <StepperDescription>
        ehkeh ehke hekhe e heke hek h is the thrid step
      </StepperDescription>
    </StepperTrigger>
  </StepperItem>
</Stepper>

// vertical stepper + stepMove=false
<div class=&quot;w-200&quot;>
<Stepper :stepMove=&quot;false&quot; orientation=&quot;vertical&quot;>
  <StepperItem :step=&quot;1&quot;>
    <StepperTrigger>
      <StepperIndicator>1</StepperIndicator>
      <StepperTitle>Step 1</StepperTitle>
      <StepperDescription>This is the first step</StepperDescription>
    </StepperTrigger>
    <StepperSeparator />
  </StepperItem>
  <StepperItem :step=&quot;2&quot;>
    <StepperTrigger>
      <StepperIndicator>2</StepperIndicator>
      <StepperTitle>Step 2</StepperTitle>
      <StepperDescription>
        hkeh ehke hekhe e heke hek h is the thrid stephkeh ehke hekhe e heke hek h
        is the thrid step
      </StepperDescription>
    </StepperTrigger>
    <StepperSeparator />
  </StepperItem>
  <StepperItem :step=&quot;3&quot;>
    <StepperTrigger>
      <StepperIndicator>3</StepperIndicator>
      <StepperTitle>Step 3</StepperTitle>
      <StepperDescription>This is the thrid step</StepperDescription>
    </StepperTrigger>
  </StepperItem>
</Stepper>
</div>
                `" />
              </CardContent>
            </Card>
          </div>
        </section>

        <section id="toastSection" class="mb-24 rounded-md bg-white p-16">
          <h3 class="text-24 font-medium text-gray-800">Toast (Sonner)</h3>
          <div class="content mt-16">
            <!-- 기본 -->
            <Card class="mb-24">
              <CardHeader>
                <div class="flex items-center justify-between">
                  <div>
                    <CardTitle>Toast (Sonner)</CardTitle>
                    <CardDescription>Toast (Sonner) 기본 ui</CardDescription>
                  </div>
                  <div>
                    <SwitchSquare
                      class="content-end"
                      :options="[
                        { value: 'preview', label: 'Preview', icon: 'visibility' },
                        { value: 'code', label: 'Code', icon: 'integration_instructions' },
                      ]"
                      v-model="previewState['toast']" />
                  </div>
                </div>
              </CardHeader>
              <CardContent v-show="previewState['toast'] == 'preview'">
                <div>
                  <!-- 타입별 -->
                  <div>
                    <p class="mb-4 text-sm font-medium text-gray-500">타입별</p>
                    <div class="flex flex-wrap gap-12">
                      <Button variant="outline" @click="toast('기본 메시지입니다.')">
                        기본 (default)
                      </Button>
                      <Button
                        variant="success"
                        @click="toast.success('성공적으로 처리되었습니다.')">
                        Success
                      </Button>
                      <Button variant="danger" @click="toast.error('오류가 발생했습니다.')">
                        Error
                      </Button>
                      <Button variant="warning" @click="toast.warning('주의가 필요합니다.')">
                        Warning
                      </Button>
                      <Button variant="info" @click="toast.info('참고 정보입니다.')">Info</Button>
                    </div>
                  </div>

                  <!-- 로딩 -->
                  <div>
                    <p class="mb-4 mt-12 text-sm font-medium text-gray-500">로딩 → 완료 전환</p>
                    <div class="flex flex-wrap gap-12">
                      <Button variant="outline" @click="showLoadingToast">로딩 후 완료</Button>
                      <Button variant="outline" @click="showLoadingErrorToast">로딩 후 에러</Button>
                    </div>
                  </div>

                  <!-- 액션 버튼 포함 -->
                  <div>
                    <p class="mb-4 mt-12 text-sm font-medium text-gray-500">액션 버튼 포함</p>
                    <Button variant="outline" @click="showActionToast">실행 취소 포함</Button>
                  </div>
                </div>
              </CardContent>
              <CardContent v-show="previewState['toast'] == 'code'">
                <CodeBlock
                  :code="`
<!-- 타입별 -->
<div>
  <p class=&quot;mb-4 text-sm font-medium text-gray-500&quot;>타입별</p>
  <div class=&quot;flex flex-wrap gap-12&quot;>
    <Button variant=&quot;outline&quot; @click=&quot;toast('기본 메시지입니다.')&quot;>
      기본 (default)
    </Button>
    <Button
      variant=&quot;success&quot;
      @click=&quot;toast.success('성공적으로 처리되었습니다.')&quot;>
      Success
    </Button>
    <Button variant=&quot;danger&quot; @click=&quot;toast.error('오류가 발생했습니다.')&quot;>
      Error
    </Button>
    <Button variant=&quot;warning&quot; @click=&quot;toast.warning('주의가 필요합니다.')&quot;>
      Warning
    </Button>
    <Button variant=&quot;info&quot; @click=&quot;toast.info('참고 정보입니다.')&quot;>Info</Button>
  </div>
</div>

<!-- 로딩 -->
<div>
  <p class=&quot;mb-4 mt-12 text-sm font-medium text-gray-500&quot;>로딩 → 완료 전환</p>
  <div class=&quot;flex flex-wrap gap-12&quot;>
    <Button variant=&quot;outline&quot; @click=&quot;showLoadingToast&quot;>로딩 후 완료</Button>
    <Button variant=&quot;outline&quot; @click=&quot;showLoadingErrorToast&quot;>로딩 후 에러</Button>
  </div>
</div>

<!-- 액션 버튼 포함 -->
<div>
  <p class=&quot;mb-4 mt-12 text-sm font-medium text-gray-500&quot;>액션 버튼 포함</p>
  <Button variant=&quot;outline&quot; @click=&quot;showActionToast&quot;>실행 취소 포함</Button>
</div>

<script setup lang=&quot;ts&quot;>
  function showLoadingToast() {
    const id = toast.loading('처리 중...');
    setTimeout(() => {
      toast.success('완료되었습니다.', { id });
    }, 2000);
  }

  function showLoadingErrorToast() {
    const id = toast.loading('처리 중...');
    setTimeout(() => {
      toast.error('처리에 실패했습니다.', { id });
    }, 2000);
  }

  function showActionToast() {
    toast('항목이 삭제되었습니다.', {
      action: {
        label: '실행 취소',
        onClick: () => toast.success('삭제가 취소되었습니다.'),
      },
    });
  }
</script>
                `" />
              </CardContent>
            </Card>
          </div>
        </section>

        <section id="noticeBoxSection" class="mb-24 rounded-md bg-white p-16">
          <h3 class="text-24 font-medium text-gray-800">NoticeBox</h3>
          <div class="content mt-16">
            <!-- 기본 -->
            <Card class="mb-24">
              <CardHeader>
                <div class="flex items-center justify-between">
                  <div>
                    <CardTitle>Box</CardTitle>
                    <CardDescription>Box ui</CardDescription>
                  </div>
                  <div>
                    <SwitchSquare
                      class="content-end"
                      :options="[
                        { value: 'preview', label: 'Preview', icon: 'visibility' },
                        { value: 'code', label: 'Code', icon: 'integration_instructions' },
                      ]"
                      v-model="previewState['box']" />
                  </div>
                </div>
              </CardHeader>
              <CardContent v-show="previewState['box'] == 'preview'">
                <div class="flex flex-col gap-8">
                  <NoticeBox>NoticeBox 메시지 입니다.</NoticeBox>

                  <NoticeBox class="bg-warning-foreground text-warning">
                    <template #icon>
                      <i class="material-icons">warning</i>
                    </template>
                    NoticeBox 메시지 입니다. Lorem ipsum dolor sit amet, consectetur adipisicing
                    elit. Quis magnam repellat, non dignissimos corporis error iure nemo quam est
                    ad? Facilis id iusto voluptatibus quis autem hic corporis dolores qui!
                  </NoticeBox>
                </div>
              </CardContent>
              <CardContent v-show="previewState['box'] == 'code'">
                <CodeBlock
                  :code="`
<!-- 일반 -->
<NoticeBox>NoticeBox 메시지 입니다.</NoticeBox>

<!-- 커스텀 -->
<NoticeBox class=&quot;bg-warning-foreground text-warning&quot;>
<template #icon>
  <i class=&quot;material-icons&quot;>warning</i>
</template>
NoticeBox 메시지 입니다. Lorem ipsum dolor sit amet, consectetur adipisicing
elit. Quis magnam repellat, non dignissimos corporis error iure nemo quam est
ad? Facilis id iusto voluptatibus quis autem hic corporis dolores qui!
</NoticeBox>
              `" />
              </CardContent>
            </Card>
          </div>
        </section>

        <section id="tableSection" class="mb-24 rounded-md bg-white p-16">
          <h3 class="text-24 font-medium text-gray-800">Table</h3>
          <div class="content mt-16">
            <!-- 기본 -->
            <Card class="mb-24">
              <CardHeader>
                <div class="flex items-center justify-between">
                  <div>
                    <CardTitle>Table</CardTitle>
                    <CardDescription>Table 기본 ui</CardDescription>
                  </div>
                  <div>
                    <SwitchSquare
                      class="content-end"
                      :options="[
                        { value: 'preview', label: 'Preview', icon: 'visibility' },
                        { value: 'code', label: 'Code', icon: 'integration_instructions' },
                      ]"
                      v-model="previewState['table']" />
                  </div>
                </div>
              </CardHeader>
              <CardContent v-show="previewState['table'] == 'preview'">
                <Table>
                  <TableCaption>A list of your recent invoices.</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <Checkbox
                          id="select-all-checkbox"
                          name="select-all-checkbox"
                          v-model="selectAll" />
                      </TableHead>
                      <TableHead>Invoice</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Input</TableHead>
                      <TableHead class="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow :key="invoice.invoice" v-for="(invoice, index) in tableInvoice">
                      <TableCell>
                        <Checkbox
                          :id="'row-' + index + '-checkbox'"
                          :name="'row-' + index + '-checkbox'"
                          v-model="invoice.is_check" />
                      </TableCell>
                      <TableCell>{{ invoice.invoice }}</TableCell>
                      <TableCell>{{ invoice.paymentStatus }}</TableCell>
                      <TableCell>{{ invoice.paymentMethod }}</TableCell>
                      <TableCell>
                        <Input
                          id="tableInput_1"
                          type="input"
                          class="h-28 px-8 text-[14px]"
                          placeholder="텍스트를 작성해주세요."
                          v-model="invoice.input" />
                      </TableCell>
                      <TableCell class="text-right">{{ invoice.totalAmount }}</TableCell>
                    </TableRow>
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell colspan="5">Total</TableCell>
                      <TableCell class="text-right">$2,500.00</TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </CardContent>
              <CardContent v-show="previewState['table'] == 'code'">
                <CodeBlock
                  :code="`
<!-- Table -->
<Table>
  <TableCaption>A list of your recent invoices.</TableCaption>
  <TableHeader>
    <TableRow>
      <TableHead>
        <Checkbox
          id=&quot;select-all-checkbox&quot;
          name=&quot;select-all-checkbox&quot;
          v-model=&quot;selectAll&quot; />
      </TableHead>
      <TableHead>Invoice</TableHead>
      <TableHead>Status</TableHead>
      <TableHead>Method</TableHead>
      <TableHead>Input</TableHead>
      <TableHead class=&quot;text-right&quot;>Amount</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow :key=&quot;invoice.invoice&quot; v-for=&quot;(invoice, index) in tableInvoice&quot;>
      <TableCell>
        <Checkbox
          :id=&quot;'row-' + index + '-checkbox'&quot;
          :name=&quot;'row-' + index + '-checkbox'&quot;
          v-model=&quot;invoice.is_check&quot; />
      </TableCell>
      <TableCell>{{ invoice.invoice }}</TableCell>
      <TableCell>{{ invoice.paymentStatus }}</TableCell>
      <TableCell>{{ invoice.paymentMethod }}</TableCell>
      <TableCell>
        <Input
          id=&quot;tableInput_1&quot;
          type=&quot;input&quot;
          class=&quot;h-28 px-8 text-[14px]&quot;
          placeholder=&quot;텍스트를 작성해주세요.&quot;
          v-model=&quot;invoice.input&quot; />
        <TableCell>
      <TableCell class=&quot;text-right&quot;>{{ invoice.totalAmount }}</TableCell>
    </TableRow>
  </TableBody>
  <TableFooter>
    <TableRow>
      <TableCell colspan=&quot;5&quot;>Total</TableCell>
      <TableCell class=&quot;text-right&quot;>$2,500.00</TableCell>
    </TableRow>
  </TableFooter>
</Table>
<script setup lang=&quot;ts&quot;>
  const tableInvoice = reactive([
    {
      id: '1',
      is_check: true,
      invoice: 'INV001',
      paymentStatus: 'Paid',
      totalAmount: '$250.00',
      paymentMethod: 'Credit Card',
      input: 'input text',
    },
    {
      id: '2',
      is_check: false,
      invoice: 'INV002',
      paymentStatus: 'Pending',
      totalAmount: '$150.00',
      paymentMethod: 'PayPal',
      input: '',
    },
    {
      id: '3',
      is_check: true,
      invoice: 'INV003',
      paymentStatus: 'Unpaid',
      totalAmount: '$350.00',
      paymentMethod: 'Bank Transfer',
      input: '',
    },
    {
      id: '4',
      is_check: false,
      invoice: 'INV004',
      paymentStatus: 'Paid',
      totalAmount: '$450.00',
      paymentMethod: 'Credit Card',
      input: 'input text 4',
    },
    {
      id: '5',
      is_check: true,
      invoice: 'INV005',
      paymentStatus: 'Paid',
      totalAmount: '$550.00',
      paymentMethod: 'PayPal',
      input: '',
    },
    {
      id: '6',
      is_check: true,
      invoice: 'INV006',
      paymentStatus: 'Pending',
      totalAmount: '$200.00',
      paymentMethod: 'Bank Transfer',
      input: '',
    },
    {
      id: '7',
      is_check: false,
      invoice: 'INV007',
      paymentStatus: 'Unpaid',
      totalAmount: '$300.00',
      paymentMethod: 'Credit Card',
      input: '',
    },
  ]);

  const selectAll = computed({
    get: () =>
      tableInvoice.length > 0 && tableInvoice.every((row: { is_check: boolean }) => row.is_check),
    set: (value: boolean) => {
      tableInvoice.forEach((row: { is_check: boolean }) => (row.is_check = value));
    },
  });
</script>

                `" />
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </div>
  </Container>
</template>

<script setup lang="ts">
import { navigationMenuTriggerStyle } from '@/components/ui/navigation-menu/index';
import { ref, reactive, computed } from 'vue';
import type { DateRange } from 'radix-vue';

import { CalendarDate, today, getLocalTimeZone } from '@internationalized/date';
import type { DateValue } from '@internationalized/date';

definePageMeta({
  middleware: 'dev',
});

useHead({
  title: 'template',
});

const scrollToSection = (hash: string) => {
  const el = document.getElementById(hash.replace('#', ''));
  if (el) {
    const offset = 100;
    const elementPosition = el.getBoundingClientRect().top + window.scrollY;
    const offsetPosition = elementPosition - offset;

    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth',
    });

    history.pushState(null, '', hash);
    activeSection.value = hash;
  }
};

let sectionObserver: IntersectionObserver | null = null;

onMounted(() => {
  document.getElementById('content')?.classList.add('bg-gray-100');
  // Prism.highlightAll();

  activeSection.value = window.location.hash || '';

  // 새로고침 시 해시 위치로 스크롤
  if (route.hash) {
    nextTick(() => {
      const el = document.getElementById(route.hash.replace('#', ''));
      if (el) {
        const offset = 100;
        const elementPosition = el.getBoundingClientRect().top + window.scrollY;
        const offsetPosition = elementPosition - offset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth',
        });

        history.pushState(null, '', route.hash);
        activeSection.value = route.hash;
      }
    });
  }

  // IntersectionObserver로 활성 섹션 추적
  sectionObserver = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const hash = `#${entry.target.id}`;
          activeSection.value = hash;
          history.replaceState(null, '', hash);
        }
      });
    },
    { rootMargin: '-10% 0px -80% 0px', threshold: 0 }
  );

  componentItems.forEach(item => {
    const el = document.getElementById(item.path.replace('#', ''));
    if (el) sectionObserver!.observe(el);
  });
});
onUnmounted(() => {
  document.getElementById('content')?.classList.remove('bg-gray-100');
  sectionObserver?.disconnect();
});

// 템플렛 내 컴포넌트 링크
const route = useRoute();
const activeSection = ref('');

const componentItems = [
  { path: '#textSection', label: 'Text' },
  { path: '#inputSection', label: 'Input' },
  { path: '#timepickerSection', label: 'Timepicker' },
  { path: '#checkboxSection', label: 'Checkbox' },
  { path: '#selectSection', label: 'Select' },
  { path: '#dropdownSection', label: 'Dropdown' },
  { path: '#buttonSection', label: 'Button' },
  { path: '#badgeSection', label: 'Badge' },
  { path: '#dialogSection', label: 'Alert / Modal' },
  { path: '#tooltipSection', label: 'Tooltips' },
  { path: '#popoverSection', label: 'Popover' },
  { path: '#calendarSection', label: 'Calendar' },
  { path: '#accordionSection', label: 'Accordion' },
  { path: '#navigationSection', label: 'Navigation' },
  { path: '#breadcrumbSection', label: 'Breadcrumb' },
  { path: '#paginationSection', label: 'Pagination' },
  { path: '#switchSection', label: 'Switch' },
  { path: '#toastSection', label: 'Toast' },
  { path: '#noticeBoxSection', label: 'NoticeBox' },
  { path: '#tableSection', label: 'Table' },

  // { path: '/guide/modal', label: 'Modal' },
  // { path: '/guide/pagination', label: 'Pagination' },
  // { path: '/guide/progress', label: 'Progress' },
];

const searchKeyword = ref('');
const filteredComponentItems = computed(() => {
  if (!searchKeyword.value) return componentItems;

  return componentItems.filter(item =>
    item.label.toLowerCase().includes(searchKeyword.value.toLowerCase())
  );
});

// 컴포넌트 내 코드 on / off
const _previewData = reactive<Record<string, 'preview' | 'code'>>({});
const previewState = new Proxy(_previewData, {
  get(target, key) {
    if (typeof key === 'string' && !(key in target)) {
      target[key] = 'preview';
    }
    return Reflect.get(target, key);
  },
  set(target, key, value) {
    return Reflect.set(target, key, value);
  },
});

// input time
const inputTime = ref('');
// input text
const inputText = ref('input text 변수');

// Time data
const time = ref('09:30');
const time24 = ref('14:05');

// nav data
const navComponents: { title: string; href: string; description: string }[] = [
  {
    title: '주요 기능',
    href: '#',
    description: '핵심 서비스 기능을 한눈에 확인하세요.',
  },
  {
    title: '요금 안내',
    href: '#',
    description: '합리적인 가격으로 원하는 플랜을 선택하세요.',
  },
  {
    title: '파트너십',
    href: '#',
    description: '함께 성장할 파트너를 모집합니다.',
  },
  {
    title: '회사 소개',
    href: '#',
    description: '저희 팀과 미션에 대해 알아보세요.',
  },
];

// toast
function showLoadingToast() {
  const id = toast.loading('처리 중...');
  setTimeout(() => {
    toast.success('완료되었습니다.', { id });
  }, 2000);
}

function showLoadingErrorToast() {
  const id = toast.loading('처리 중...');
  setTimeout(() => {
    toast.error('처리에 실패했습니다.', { id });
  }, 2000);
}

function showActionToast() {
  toast('항목이 삭제되었습니다.', {
    action: {
      label: '실행 취소',
      onClick: () => toast.success('삭제가 취소되었습니다.'),
    },
  });
}

// calendar data
const selectedDate = ref<DateValue>(new CalendarDate(2026, 3, 15));
const unavailableDates = [new CalendarDate(2026, 3, 1), new CalendarDate(2026, 5, 5)];
const isDateUnavailable = (date: DateValue) => unavailableDates.some(d => d.compare(date) === 0);

// highlight할 날짜 목록
const highlightedDates: DateValue[] = [
  new CalendarDate(2026, 3, 10),
  new CalendarDate(2026, 3, 20),
  new CalendarDate(2026, 4, 5),
];

// range calendar data
const start = today(getLocalTimeZone());
const end = start.add({ days: 7 });
const selectedRangeDate = ref({
  start,
  end,
}) as Ref<DateRange>;

// VueSelect Ajax 예시 (GitHub API)
type RepoOption = { label: string; value: number };

const repoOptions = ref<RepoOption[]>([]);
const selectedRepo = ref<RepoOption | null>(null);

let repoSearchTimer: ReturnType<typeof setTimeout> | null = null;
const onRepoSearch = (search: string, loading: (v: boolean) => void) => {
  if (!search.length) {
    repoOptions.value = [];
    return;
  }
  loading(true);
  if (repoSearchTimer) clearTimeout(repoSearchTimer);
  repoSearchTimer = setTimeout(async () => {
    try {
      const res = await $fetch<{ items: Array<{ id: number; full_name: string }> }>(
        `https://api.github.com/search/repositories?q=${encodeURIComponent(search)}`
      );
      repoOptions.value = (res.items ?? []).map(item => ({
        label: item.full_name,
        value: item.id,
      }));
    } finally {
      loading(false);
    }
  }, 350);
};

// VueSelect 기본 예시
const schoolOptions = [
  { label: '서울대학교', value: 'snu' },
  { label: '연세대학교', value: 'yonsei' },
  { label: '고려대학교', value: 'korea' },
  { label: '성균관대학교', value: 'skku' },
  { label: '한양대학교', value: 'hanyang' },
];
const selectedSchool = ref({ label: '연세대학교', value: 'yonsei' });

// VueSelect 커스텀 템플릿 예시 (아이콘 포함)
const subjectOptions = [
  { label: '수학', value: 'math', icon: 'calculate', desc: '어려워...' },
  { label: '과학', value: 'science', icon: 'science', desc: '도 어려워...' },
  { label: '국어', value: 'korean', icon: 'menu_book' },
  {
    label:
      '영어 라벨을 길게 써봅시다 영어 라벨 template 텍스트 입니다. 옵션값이 길어지면 이렇게 보입니다.',
    value: 'english',
    icon: 'language',
  },
  { label: '체육', value: 'pe', icon: 'sports_soccer' },
];
const selectedSubject = ref([
  { label: '과학', value: 'science', icon: 'science', desc: '도 어려워...' },
  { label: '국어', value: 'korean', icon: 'menu_book' },
  {
    label:
      '영어 라벨을 길게 써봅시다 영어 라벨 template 텍스트 입니다. 옵션값이 길어지면 이렇게 보입니다.',
    value: 'english',
    icon: 'language',
  },
]);

// Switch
const switchBasic = ref(false);
const switchLabel = ref(true);

// SwitchSquare
const switchSquareView = ref('preview');
const switchSquareMode = ref('list');
const switchSquareLayout = ref('list');

// dropdown - checkbox
const showTitle = ref(true);
const showDate = ref(false);
const showAuthor = ref(false);

// pagination
const page1 = ref(1);
const page2 = ref(1);

const tableInvoice = reactive([
  {
    id: '1',
    is_check: true,
    invoice: 'INV001',
    paymentStatus: 'Paid',
    totalAmount: '$250.00',
    paymentMethod: 'Credit Card',
    input: 'input text',
  },
  {
    id: '2',
    is_check: false,
    invoice: 'INV002',
    paymentStatus: 'Pending',
    totalAmount: '$150.00',
    paymentMethod: 'PayPal',
    input: '',
  },
  {
    id: '3',
    is_check: true,
    invoice: 'INV003',
    paymentStatus: 'Unpaid',
    totalAmount: '$350.00',
    paymentMethod: 'Bank Transfer',
    input: '',
  },
  {
    id: '4',
    is_check: false,
    invoice: 'INV004',
    paymentStatus: 'Paid',
    totalAmount: '$450.00',
    paymentMethod: 'Credit Card',
    input: 'input text 4',
  },
  {
    id: '5',
    is_check: true,
    invoice: 'INV005',
    paymentStatus: 'Paid',
    totalAmount: '$550.00',
    paymentMethod: 'PayPal',
    input: '',
  },
  {
    id: '6',
    is_check: true,
    invoice: 'INV006',
    paymentStatus: 'Pending',
    totalAmount: '$200.00',
    paymentMethod: 'Bank Transfer',
    input: '',
  },
  {
    id: '7',
    is_check: false,
    invoice: 'INV007',
    paymentStatus: 'Unpaid',
    totalAmount: '$300.00',
    paymentMethod: 'Credit Card',
    input: '',
  },
]);

const selectAll = computed({
  get: () =>
    tableInvoice.length > 0 && tableInvoice.every((row: { is_check: boolean }) => row.is_check),
  set: (value: boolean) => {
    tableInvoice.forEach((row: { is_check: boolean }) => (row.is_check = value));
  },
});
</script>
