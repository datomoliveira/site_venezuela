# GET Venezuela — site institucional

Site editorial em 3D para a **Escola Municipal Venezuela (GET Venezuela)**, escola pública da rede municipal do Rio de Janeiro, em Campo Grande. Ensino Fundamental anos finais, 6º ao 9º ano, com classes especiais e AEE.

Stack estática: HTML, CSS e JavaScript puro, com Three.js local. Não há build, Node ou Python — o site é servido por um pequeno servidor PowerShell incluído no projeto.

---

## Pré-visualizar

```powershell
powershell -ExecutionPolicy Bypass -File .\serve.ps1
```

Abra **http://localhost:4173/**. Para outra porta:

```powershell
powershell -ExecutionPolicy Bypass -File .\serve.ps1 -Port 8080
```

> O `serve.ps1` precisa permanecer em ASCII (PowerShell 5.1 sem BOM interpreta acentos incorretamente). Se for editá-lo, mantenha o texto sem caracteres acentuados.

O site também funciona em qualquer servidor estático (GitHub Pages, Netlify, IIS, Apache). Abrir os arquivos direto por `file://` não é recomendado: os módulos ES e o carregamento das cenas 3D exigem HTTP.

---

## Estrutura

```
.
├─ index.html          home: manifesto, oferta, galeria, endereço, chamada
├─ escola.html         a escola: princípios, método, espaços, citação
├─ ensino.html         currículo, trilhas 6º–9º, STEAM, classes especiais/AEE
├─ vida.html           vida escolar: galeria, frentes de projeto, Instagram
├─ contato.html        contatos, mapa, matrícula, documentos, FAQ, formulário
├─ serve.ps1           servidor estático local (PowerShell)
├─ css/
│  ├─ style.css        tokens, base, header/menu, hero, seções, footer, animações
│  ├─ pages.css        heroes internos, splits, STEAM, trilhas, galeria, FAQ, formulário
│  └─ fonts.css        @font-face das fontes auto-hospedadas
├─ js/
│  ├─ main.js          revelações, transições, menu, cursor, FAQ, copiar, formulário
│  └─ scene.js         cenas Three.js, ambiente, materiais e sombras de contato
└─ assets/
   ├─ favicon.svg      monograma V
   ├─ og.png           cartão de compartilhamento 1200×630
   ├─ fonts/           Archivo, IBM Plex Mono, Instrument Serif + licenças OFL
   └─ vendor/          three.module.js (r170)
```

---

## Sistema visual

| Token | Valor | Uso |
|---|---|---|
| `--paper` | `#E9E3D5` | fundo principal, papel quente |
| `--ink` | `#14130E` | texto e traços |
| `--clay` | `#BC4526` | acento terracota |
| `--clay-ink` | `#8E2F16` | acento com contraste para texto |
| `--forest` | `#14312A` | blocos escuros, rodapé |
| `--bone` | `#F4EDDD` | texto sobre escuro |

Tipografia: **Archivo** variável (largura e peso) para títulos e texto de interface; **Instrument Serif** itálico para acentos editoriais; **IBM Plex Mono** para etiquetas, números e dados. Todas auto-hospedadas em `assets/fonts/` (subsets latin e latin-ext), sem chamadas a CDNs.

Composição assimétrica em grid de 12 colunas, com blocos que ora avançam, ora recuam da margem. A hierarquia evita centralização: hero deslocado, pratos gráficos em alturas diferentes, listas com numeração monoespaçada e filetes finos.

### Páginas e cenas 3D

| Página | Cena | Composição |
|---|---|---|
| `index.html` | escultura V extrudada + anéis cromados | hero |
| `escola.html` | anéis orbitais | hero interno |
| `ensino.html` | grade de cubos animada | hero interno |
| `vida.html` | esfera de pontos | hero interno |
| `contato.html` | V | hero interno |

As cenas usam materiais físicos, ambiente procedural (sem HDR externo) e sombra de contato fixa no chão. O canvas é montado apenas quando o palco tem área visível; no mobile, onde o palco interno é oculto por CSS, nenhum contexto WebGL é criado. Com `prefers-reduced-motion`, a animação para e a primeira pose é renderizada. Se o WebGL falhar, o palco cai para o fallback gráfico em CSS.

---

## Interações

- **Transições entre páginas**: véu de três painéis + `sessionStorage` (`gv-nav`), com fade de entrada e saída.
- **Revelações**: `IntersectionObserver` + varredura por posição no scroll (resguardo para iframes e navegadores antigos). Respeitam `prefers-reduced-motion`.
- **Menu mobile**: trava o scroll, gerencia foco, `inert`, `aria-hidden` e fecha com `Esc`.
- **FAQ**: `aria-expanded`, `aria-controls` e painéis `inert` quando fechados.
- **Copiar**: botões de telefone, e-mail e endereço com fallback para `execCommand`.
- **Formulário**: monta um `mailto:` com assunto e corpo; não depende de backend.

---

## Acessibilidade

- Um `h1` por página e hierarquia de títulos sem saltos.
- Skip link, landmarks (`header`, `main`, `nav`, `footer`) e menu com foco gerenciado.
- Contraste revisado: textos pequenos usam `--ink-45` recalibrado (≥ 4,5:1 no papel mais escuro); botões primários usam `#B23F22` com texto osso (≥ 4,5:1); rodapé usa osso a 62% sobre floresta (5,56:1).
- Alvos de toque de controles isolados com no mínimo 24 px; links dentro de frases seguem a exceção da WCAG 2.5.8.
- `prefers-reduced-motion` desliga animações, cursor customizado, parallax e movimento das cenas.
- Foco visível em todos os elementos interativos.

---

## SEO e compartilhamento

Cada página tem `title`, `description`, Open Graph, Twitter Card e `theme-color`. A home inclui JSON-LD `School` com endereço, telefone, e-mail e perfis sociais. O cartão `assets/og.png` (1200×630) é gerado a partir da identidade do site.

Ao publicar em um domínio, troque `content="assets/og.png"` por uma URL absoluta (`https://seudominio.com/assets/og.png`) nas cinco páginas — alguns rastreadores não resolvem caminhos relativos.

---

## Como editar

### Textos

Todo o conteúdo está diretamente no HTML, em português. Não há CMS. Procure pelos comentários de seção (`<!-- ================= 03 · OFERTA ================= -->`) para localizar cada bloco.

### Fotos

As áreas de imagem são **pratos gráficos** intencionais (`.plate__art` com classes `art--clay`, `art--forest`, `art--bone`, `art--sand`, `art--night`), usadas como composição tipográfica até que existam fotos autorizadas da escola. Para trocar por uma foto:

```html
<figure class="plate g-a" data-cursor="ver">
  <span class="plate__num">01</span>
  <img class="plate__art" src="assets/fotos/recreio.jpg"
       alt="Estudantes no recreio, pátio da escola" loading="lazy">
  <figcaption class="plate__cap"><span>01 / cotidiano</span> Recreio</figcaption>
</figure>
```

Regras: use imagens com direito de uso e consentimento de imagem; descreva a cena em `alt` (não repita apenas o título); prefira JPG/WebP com no máximo ~1600 px de largura. O CSS já aplica `object-fit: cover`.

### Contatos, endereço e links

Dados usados no site:

- Rua Amaral Costa, 37 — Campo Grande, Rio de Janeiro — RJ, CEP 23050-260
- Telefone: (21) 3394-1955
- E-mail: emvenezuela@rioeduca.net
- CRE 09.18.013 · INEP 33083479
- Instagram: https://www.instagram.com/getvenezuela/
- Facebook: https://www.facebook.com/emvenezuela091813/

Atualize esses dados nos cinco arquivos e no JSON-LD da home se algo mudar. O mapa usa um SVG estilizado com link para o Google Maps (sem iframe e sem cookies de terceiros).

### Formulário

O formulário de contato abre o cliente de e-mail com a mensagem preenchida. Para um envio real, conecte um endpoint (Formspree, Netlify Forms etc.) e ajuste `setupForm()` em `js/main.js`. Não há armazenamento de dados no site.

---

## Conteúdo a confirmar antes de publicar

O site evita inventar números, horários, nomes de profissionais e notícias. Ainda assim, confirme com a secretaria:

- horários de atendimento e de funcionamento;
- calendário e procedimentos de matrícula do ano corrente;
- lista de documentos exigidos (a página apresenta uma lista orientativa);
- nomes e fotos de estudantes, com autorização;
- quais projetos e oficinas estão ativos neste ano;
- telefone, e-mail e redes sociais oficiais.

Os textos descrevem o modelo GET (Ginásio Educacional Tecnológico) de forma geral — STEAM, projetos, cultura maker, AEE — sem atribuir práticas específicas que não tenham sido confirmadas.

---

## Verificações realizadas

- 5 páginas × 4 larguras (1440, 1024, 800 e 390 px): sem overflow horizontal, um `h1` por página, hierarquia de títulos válida.
- Revelações alcançam 100% dos alvos após scroll em todas as combinações.
- Zero requisições externas: fontes, Three.js, imagens e CSS são locais.
- 10 faces de fonte carregadas localmente; fallback de fonte do sistema caso o arquivo falte.
- Cenas WebGL montadas e renderizando (verificação por captura de canvas).
- Transição de página testada: véu cobre, `sessionStorage` é limpo e a página de destino carrega.
- Auditoria DOM: sem IDs duplicados, sem referências ARIA quebradas, sem controles sem nome acessível, sem `tabindex` positivo, links `target="_blank"` com `noopener`.
- Formulário com três campos e três `label`s associados; FAQ com `aria-expanded`/`inert` coerentes.

---

## Créditos

- Three.js r170 — MIT.
- Archivo, IBM Plex Mono e Instrument Serif — SIL Open Font License 1.1; textos das licenças em `assets/fonts/OFL-*.txt`.
- Tipografia, direção de arte e código: projeto do site GET Venezuela.

> Este é um site institucional independente, feito para apresentar a escola. Não é uma publicação oficial da Secretaria Municipal de Educação até revisão e autorização da unidade.
