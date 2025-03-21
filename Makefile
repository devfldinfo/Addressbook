.PHONY: cv

CC = pdflatex
CV_DIR = output

output.pdf: output.tex
	$(CC) -output-directory=$(CV_DIR) $<

clean:
	rm -rf $(CV_DIR)/*.pdf
