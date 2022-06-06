import resolve from '@rollup/plugin-node-resolve'
import vue from 'rollup-plugin-vue'
import babel from 'rollup-plugin-babel'
import commonjs from '@rollup/plugin-commonjs'
import postcss from 'rollup-plugin-postcss'
import { terser } from 'rollup-plugin-terser'

const config = {
  input: './index.js',
  external: ['vue', 'element-ui', 'mc-form'],
  output: {
    exports: 'named',
    globals: {
      vue: 'Vue',
      'element-ui': 'ElementUI',
      'mc-form': 'McForm'
    }
  },

  plugins: [
    resolve(),
    vue({
      css: true,
      compileTemplate: true
    }),
    babel({
      exclude: '**/node_modules/**',
      presets: ['@vue/babel-preset-jsx']
    }),
    commonjs(),
    postcss({
      minimize: true,
      extensions: ['.css', '.scss'],
    }),

    terser()
  ]
}

export default config
