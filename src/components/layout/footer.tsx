import { Container } from './container'

export function Footer() {
  return (
    <footer className="border-t">
      <Container>
        <div className="py-8">
          <div className="text-center">
            <p className="text-muted-foreground text-sm">
              © {new Date().getFullYear()} Invoice Web. 모든 권리 보유.
            </p>
          </div>
        </div>
      </Container>
    </footer>
  )
}
