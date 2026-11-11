"""
Instala uma atualização do app: extrai o zip da versão nova (baixado do GitHub Releases) por cima da pasta do app.

Uso: python updater.py <arquivo.zip> <pasta do app>
Imprime uma linha JSON por etapa ({"progress": 0..1}) e, no fim, {"done": true, "packageChanged": bool}.
Os dados do usuário (audiobooks, ajustes e Convertidos) ficam fora da pasta do app e não são tocados.
"""
import hashlib
import json
import os
import sys
import zipfile


def _hash(caminho):
    try:
        with open(caminho, "rb") as f:
            return hashlib.sha256(f.read()).hexdigest()
    except OSError:
        return ""


def instalar(arquivo_zip, pasta):
    pasta = os.path.abspath(pasta)
    if os.path.isdir(os.path.join(pasta, ".git")):
        raise RuntimeError("Esta é uma pasta de desenvolvimento (git): atualize com git pull.")
    antes = _hash(os.path.join(pasta, "package-lock.json")) + _hash(os.path.join(pasta, "package.json"))
    ignorados = []
    with zipfile.ZipFile(arquivo_zip) as z:
        itens = [i for i in z.infolist() if not i.is_dir()]
        for n, item in enumerate(itens, start=1):
            destino = os.path.abspath(os.path.join(pasta, item.filename))
            if not destino.startswith(pasta + os.sep):  # caminho fora da pasta do app: ignora
                continue
            os.makedirs(os.path.dirname(destino), exist_ok=True)
            try:
                with z.open(item) as origem, open(destino + ".novo", "wb") as saida:
                    saida.write(origem.read())
                os.replace(destino + ".novo", destino)
                modo = (item.external_attr >> 16) & 0o777
                if modo and os.name != "nt":
                    os.chmod(destino, modo)
            except OSError:
                # Arquivo em uso (ex.: o atalho .exe aberto): fica a versão anterior dele
                ignorados.append(item.filename)
                try:
                    os.remove(destino + ".novo")
                except OSError:
                    pass
            if n % 20 == 0 or n == len(itens):
                print(json.dumps({"progress": round(n / len(itens), 3)}), flush=True)
    depois = _hash(os.path.join(pasta, "package-lock.json")) + _hash(os.path.join(pasta, "package.json"))
    print(json.dumps({"done": True, "packageChanged": antes != depois, "skipped": ignorados}), flush=True)


if __name__ == "__main__":
    try:
        instalar(sys.argv[1], sys.argv[2])
    except Exception as e:
        print(json.dumps({"error": str(e)}, ensure_ascii=False), flush=True)
        sys.exit(1)
