.PHONY: cv

CC = lualatex
CV_DIR = output

output.pdf: output.tex
	$(CC) -output-directory=$(CV_DIR) $<

clean:
	rm -rf $(CV_DIR)/*.pdf
