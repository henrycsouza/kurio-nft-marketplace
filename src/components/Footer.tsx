import facebook from '../assets/social-facebook.svg'
import instagram from '../assets/social-instagram.svg'
import twitter from '../assets/social-twitter.svg'
import linkedin from '../assets/social-linkedin.svg'
import youtube from '../assets/social-youtube.svg'

const features = [
  {
    mark: 'W',
    title: 'Segurança da carteira',
    description:
      'Proteja sua carteira e colecione arte digital verificada com confiança.',
  },
  {
    mark: 'C',
    title: 'Criadores em destaque',
    description:
      'Conheça artistas, estúdios e comunidades que moldam a cultura digital na rede.',
  },
  {
    mark: 'D',
    title: 'Alertas de lançamentos',
    description:
      'Receba calendários de cunhagem, novidades de listas de acesso e análises do mercado.',
  },
]

const sections = [
  {
    title: 'Meu perfil',
    links: [
      'Meu perfil',
      'Minha coleção',
      'Atividade',
      'Estúdio do criador',
      'Lista de interesse',
    ],
  },
  {
    title: 'Central de ajuda',
    links: [
      'Central de ajuda',
      'Como comprar NFTs',
      'Carteira e segurança',
      'Política do mercado',
      'Denunciar item',
    ],
  },
  {
    title: 'Coleções',
    links: ['Arte digital', 'Fotografia', 'Música', 'Arte 3D', 'Utilidade'],
  },
]

const socials = [
  ['Facebook', facebook],
  ['Instagram', instagram],
  ['Twitter', twitter],
  ['LinkedIn', linkedin],
  ['YouTube', youtube],
]

export function Footer() {
  return (
    <footer className="kurio-footer">
      <div className="footer-features">
        {features.map((feature) => (
          <section key={feature.mark} className="footer-feature">
            <span className="footer-medallion">{feature.mark}</span>
            <h2>{feature.title}</h2>
            <p>{feature.description}</p>
          </section>
        ))}

        <section className="footer-newsletter">
          <h2>Antecipe-se ao próximo lançamento</h2>

          <div title="Cadastro de alertas indisponível nesta demonstração">
            <input
              type="email"
              aria-label="E-mail para alertas"
              placeholder="digite seu e-mail..."
              disabled
            />
            <button type="button" disabled>Enviar</button>
          </div>

          <p>
            Receba lançamentos selecionados, histórias de criadores
            e novidades do mercado.
          </p>
        </section>
      </div>

      <div className="footer-brand">
        <strong>KURIO</strong>
        <p>Feito para colecionadores,<br />criadores e cultura</p>
        <p>contato@email.com</p>
        <p>+55 11 4002 8922</p>
      </div>

      <div className="footer-links">
        {sections.map((section) => (
          <section key={section.title}>
            <h2>{section.title}</h2>

            {section.links.map((label) => (
              <button
                key={label}
                type="button"
                disabled
                title="Navegação indisponível nesta etapa"
              >
                {label}
              </button>
            ))}
          </section>
        ))}

        <section>
          <h2>Redes sociais</h2>

          <div className="footer-socials">
            {socials.map(([name, image]) => (
              <span key={name}>
                <img src={image} alt={name} />
              </span>
            ))}
          </div>

          <h2>Carteiras compatíveis</h2>
          <p className="footer-wallets">
            METAMASK · WALLETCONNECT · COINBASE
          </p>
        </section>
      </div>

      <p className="footer-copyright">
        © 2026 Kurio. Propriedade digital para todos.
      </p>
    </footer>
  )
}